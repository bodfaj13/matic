import {
  MiddlewareConsumer,
  Module,
  NestModule,
  OnApplicationBootstrap,
  RequestMethod,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InjectConnection, MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import Redis from 'ioredis';
import { Connection, STATES } from 'mongoose';
import { AuthModule } from './auth/auth.module';
import { TriageBullMqController } from './admin/triage-bullmq.controller';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TicketsModule } from './tickets/tickets.module';
import { ConditionalThrottlerGuard } from './common/guards/conditional-throttler.guard';
import { databaseConfig } from './config/database.config';
import { RequestLoggerMiddleware } from './middleware/request-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SentryModule.forRoot(),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: databaseConfig.uri,
        serverSelectionTimeoutMS: 5000,
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', '127.0.0.1'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
          // Defaults to db 0; set REDIS_DB to isolate test queues from prod.
          db: config.get<number>('REDIS_DB', 0),
          maxRetriesPerRequest: null,
          lazyConnect: true,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: 'triage' }),
    AuthModule,
    TicketsModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: config.get<number>('THROTTLE_TTL_MS', 60_000),
            limit: config.get<number>('THROTTLE_LIMIT', 100),
          },
        ],
      }),
    }),
  ],
  controllers: [AppController, TriageBullMqController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ConditionalThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule, OnApplicationBootstrap {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly configService: ConfigService,
  ) {}

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes({
      path: '*splat',
      method: RequestMethod.ALL,
    });
  }

  async onApplicationBootstrap(): Promise<void> {
    const conn = this.connection;

    if (conn.readyState === STATES.connected) {
      console.log('✅ MongoDB connected successfully');
    } else {
      console.log('⏳ MongoDB connecting...');
    }

    conn.on('connected', () => {
      console.log('✅ MongoDB connected successfully');
    });
    conn.on('error', (err: Error) => {
      console.error('❌ MongoDB connection error:', err);
    });
    conn.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    const ttl = this.configService.get<number>('THROTTLE_TTL_MS', 60_000);
    const limit = this.configService.get<number>('THROTTLE_LIMIT', 100);
    console.log(
      `✅ Rate limiting: ${limit} requests per ${ttl}ms (default throttler)`,
    );

    const redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', '127.0.0.1'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
      maxRetriesPerRequest: null,
    });
    try {
      await redis.ping();
      console.log('✅ Redis: PING ok');
    } catch (err) {
      console.error('❌ Redis PING failed:', err);
    } finally {
      redis.disconnect();
    }
  }
}
