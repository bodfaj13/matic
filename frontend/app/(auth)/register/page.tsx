'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { logError } from '@/app/utils/logger';
import { showError, showSuccess } from '@/app/utils/toast-helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  formFieldInputMutedClass,
  formFieldInputPrimaryClass,
  formFieldInputWithTrailingClass,
  formFieldLabelClass,
} from '@/lib/form-field-styles';
import { useSessionStore } from '@/lib/stores/session-store';
import { cn } from '@/lib/utils';

const schema = z.object({
  workspace_name: z.string().min(1, 'Workspace name is required'),
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid work email required'),
  password: z.string().min(8, 'At least 8 characters'),
});

type FormValues = z.infer<typeof schema>;

const showRegister = process.env.NEXT_PUBLIC_SHOW_REGISTER === 'true';

function passwordStrengthBars(password: string) {
  const n = password.length;
  if (n === 0) return 0;
  if (n < 4) return 1;
  if (n < 6) return 2;
  if (n < 8) return 3;
  return 4;
}

function RegisterDisabled() {
  return (
    <div>
      <h1 className="font-heading text-[1.85rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[2.1rem]">
        Join the intelligent tier.
      </h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
        Registration is not available on this deployment. Contact your
        administrator or enable registration in environment configuration.
      </p>
      <p className="mt-6 max-w-md rounded-xl border border-stone-200/80 bg-[#F3F2F1] p-4 text-sm text-muted-foreground">
        Set{' '}
        <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-[11px] text-foreground">
          NEXT_PUBLIC_SHOW_REGISTER=true
        </code>{' '}
        in this app and{' '}
        <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-[11px] text-foreground">
          AGENT_REGISTRATION_SECRET
        </code>{' '}
        on the server for the register proxy.
      </p>
      <p className="mt-8 text-center">
        <Link
          href="/login"
          className="text-[15px] font-semibold text-primary underline-offset-4 transition-colors hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

function RegisterForm() {
  const router = useRouter();
  const setSession = useSessionStore((s) => s.setSession);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      workspace_name: '',
      full_name: '',
      email: '',
      password: '',
    },
  });

  const passwordValue =
    useWatch({ control: form.control, name: 'password' }) ?? '';
  const filledBars = passwordStrengthBars(passwordValue);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const res = await fetch('/api/register-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });
      const data = (await res.json()) as {
        data?: { access_token: string; email: string; role: 'agent' | 'admin' };
        message?: string | string[];
      };
      if (!res.ok) {
        const msg = Array.isArray(data.message)
          ? data.message[0]
          : data.message;
        showError(msg ?? 'Registration failed');
        return;
      }
      const payload = data.data;
      if (payload?.access_token && payload.email && payload.role) {
        setSession(payload.access_token, {
          email: payload.email,
          role: payload.role,
        });
        showSuccess('Account created.');
        router.replace('/triage');
        return;
      }
      showError('Unexpected response from server.');
    } catch (e) {
      logError('Register failed', e);
      showError('Registration failed');
    }
  });

  return (
    <div>
      <h1 className="font-heading text-[1.85rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[2.1rem]">
        Join the intelligent tier.
      </h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
        Set up your workspace and start curating your support experience.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-stone-200/80 bg-[#F3F2F1] shadow-[0_8px_30px_-12px_rgba(25,25,45,0.12)]">
        <div className="h-1 bg-primary" aria-hidden />
        <form onSubmit={onSubmit} className="space-y-5 p-6 sm:p-8">
          <div className="space-y-2">
            <label htmlFor="workspace_name" className={formFieldLabelClass}>
              Workspace name
            </label>
            <Input
              id="workspace_name"
              autoComplete="organization"
              className={formFieldInputPrimaryClass}
              placeholder="e.g. Acme Corp Support"
              {...form.register('workspace_name')}
              aria-invalid={!!form.formState.errors.workspace_name}
            />
            {form.formState.errors.workspace_name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.workspace_name.message}
              </p>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="full_name" className={formFieldLabelClass}>
                Full name
              </label>
              <Input
                id="full_name"
                autoComplete="name"
                className={formFieldInputMutedClass}
                placeholder="Jane Doe"
                {...form.register('full_name')}
                aria-invalid={!!form.formState.errors.full_name}
              />
              {form.formState.errors.full_name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.full_name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className={formFieldLabelClass}>
                Work email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                className={formFieldInputMutedClass}
                placeholder="jane@acme.com"
                {...form.register('email')}
                aria-invalid={!!form.formState.errors.email}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className={formFieldLabelClass}>
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={formFieldInputWithTrailingClass('muted')}
                {...form.register('password')}
                aria-invalid={!!form.formState.errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1.5 text-stone-500 transition-colors hover:bg-white/80 hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            <div
              className="flex gap-1.5 pt-0.5"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={4}
              aria-valuenow={filledBars}
              aria-label="Password strength"
            >
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors',
                    filledBars > i ? 'bg-primary' : 'bg-stone-300/80',
                  )}
                />
              ))}
            </div>
            <p className="text-[12px] text-muted-foreground">
              Must be at least 8 characters.
            </p>
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="h-12 w-full rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground shadow-none hover:bg-primary/92"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              'Creating…'
            ) : (
              <>
                Initialize Workspace
                <ArrowRight className="ml-2 inline size-4" aria-hidden />
              </>
            )}
          </Button>
        </form>
      </div>

      <p className="mt-8 text-center text-[15px] font-semibold text-foreground">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-primary underline-offset-4 transition-colors hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  if (!showRegister) {
    return <RegisterDisabled />;
  }
  return <RegisterForm />;
}
