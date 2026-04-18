import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import helmet from 'helmet';
import { Model } from 'mongoose';
import type { Server } from 'http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TicketPriority } from '../src/common/enums/ticket-priority.enum';
import { TicketStatus } from '../src/common/enums/ticket-status.enum';
import { UserRole } from '../src/common/enums/user-role.enum';
import { User } from '../src/users/schemas/user.schema';
import { Ticket } from '../src/tickets/schemas/ticket.schema';
import { OpenaiTriageService } from '../src/triage/openai-triage.service';

describe('Smart Triage (e2e)', () => {
  let app: INestApplication | undefined;
  let agentToken: string;

  beforeAll(async () => {
    // Pin e2e to a dedicated database so the deleteMany() below never touches
    // dev / docker / Atlas data. We *unconditionally* overwrite MONGODB_URI
    // because something (NestJS Config or jest preset) auto-loads .env into
    // process.env before this hook runs — a `??` fallback would lose. Use
    // MONGODB_URI_E2E to point at a different test DB in CI.
    process.env.MONGODB_URI =
      process.env.MONGODB_URI_E2E ??
      'mongodb://127.0.0.1:27017/codematicticketsystem-e2e';
    if (!/(e2e|test)/i.test(process.env.MONGODB_URI)) {
      throw new Error(
        `Refusing to run e2e against ${process.env.MONGODB_URI}: URI must contain "e2e" or "test".`,
      );
    }
    // Pin BullMQ to a non-default Redis DB so test jobs never collide with
    // (or get picked up by) a worker pointed at the prod queue on db 0.
    process.env.REDIS_DB = process.env.REDIS_DB_E2E ?? '15';
    if (process.env.REDIS_DB === '0') {
      throw new Error('Refusing to run e2e against Redis db 0; pick 1-15.');
    }
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'e2e-jwt-secret';
    process.env.AGENT_REGISTRATION_SECRET =
      process.env.AGENT_REGISTRATION_SECRET ?? 'e2e-agent-secret';
    process.env.ADMIN_REGISTRATION_SECRET =
      process.env.ADMIN_REGISTRATION_SECRET ?? 'e2e-admin-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(OpenaiTriageService)
      .useValue({
        classify: () =>
          Promise.resolve({
            category: 'General',
            priority: TicketPriority.Medium,
          }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(helmet());
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    const userModel = app.get<Model<User>>(getModelToken(User.name));
    const ticketModel = app.get<Model<Ticket>>(getModelToken(Ticket.name));
    await userModel.deleteMany({});
    await ticketModel.deleteMany({});

    const email = `agent-${Date.now()}@e2e.test`;
    await request(app.getHttpServer() as Server)
      .post('/api/v1/auth/register')
      .set(
        'x-registration-secret',
        process.env.AGENT_REGISTRATION_SECRET ?? 'e2e-agent-secret',
      )
      .send({
        email,
        password: 'password-e2e-1',
        role: UserRole.Agent,
      })
      .expect(201);

    const login = await request(app.getHttpServer() as Server)
      .post('/api/v1/auth/login')
      .send({ email, password: 'password-e2e-1' })
      .expect(200);

    const loginBody = login.body as {
      data: { access_token: string };
    };
    agentToken = loginBody.data.access_token;
    expect(agentToken).toBeDefined();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('POST /tickets creates a ticket without auth', async () => {
    const res = await request(app.getHttpServer() as Server)
      .post('/api/v1/tickets')
      .send({
        title: 'Cannot log in',
        description: 'Login button does nothing after latest deploy.',
        customer_email: 'customer@example.com',
      })
      .expect(201);

    const body = res.body as {
      data: { title: string; triageStatus: string; _id: string };
    };
    expect(body.data).toMatchObject({
      title: 'Cannot log in',
      triageStatus: 'pending',
    });
    expect(body.data._id).toBeDefined();
  });

  it('GET /tickets requires JWT and returns paginated list', async () => {
    await request(app.getHttpServer() as Server)
      .get('/api/v1/tickets')
      .expect(401);

    const res = await request(app.getHttpServer() as Server)
      .get('/api/v1/tickets?page=1&limit=10')
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(200);

    const listBody = res.body as {
      data: unknown[];
      pageNumber: number;
      pageSize: number;
      totalCount: number;
    };
    expect(listBody.data).toBeInstanceOf(Array);
    expect(listBody).toMatchObject({
      pageNumber: 1,
      pageSize: 10,
    });
    expect(listBody.totalCount).toBeGreaterThanOrEqual(1);
  });

  it('PATCH /tickets/:id updates status', async () => {
    const create = await request(app.getHttpServer() as Server)
      .post('/api/v1/tickets')
      .send({
        title: 'Billing question',
        description: 'Invoice PDF missing.',
        customer_email: 'bill@example.com',
      })
      .expect(201);

    const created = create.body as { data: { _id: string } };
    const id = created.data._id;

    const updated = await request(app.getHttpServer() as Server)
      .patch(`/api/v1/tickets/${id}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ status: TicketStatus.InProgress })
      .expect(200);

    const patchBody = updated.body as { data: { status: string } };
    expect(patchBody.data.status).toBe(TicketStatus.InProgress);
  });
});
