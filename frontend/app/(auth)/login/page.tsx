'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { AxiosError } from 'axios';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { logError } from '@/app/utils/logger';
import { showError, showSuccess } from '@/app/utils/toast-helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  formFieldInputPrimaryClass,
  formFieldInputWithTrailingClass,
  formFieldLabelClass,
} from '@/lib/form-field-styles';
import { useLoginMutation } from '@/lib/api/auth/use-auth';
import type { BaseResponse } from '@/lib/api/types';
import {
  getApiMessageFromAxiosError,
  getFieldErrorsFromApiResponse,
} from '@/lib/api/types';
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const login = useLoginMutation();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      showSuccess('Signed in.');
      router.replace('/triage');
    } catch (err) {
      const error = err as AxiosError<BaseResponse>;
      const fieldErrors = getFieldErrorsFromApiResponse(error.response?.data);
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([key, message]) => {
          if (key in form.getValues()) {
            form.setError(key as keyof FormValues, { message });
          }
        });
      } else {
        logError(getApiMessageFromAxiosError(error), error);
        showError(getApiMessageFromAxiosError(error));
      }
    }
  });

  return (
    <div>
      <h1 className="font-heading text-[1.85rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[2.1rem]">
        Welcome back
      </h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
        Sign in to your workspace and pick up right where you left off in the
        queue.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className={formFieldLabelClass}>
            Work email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            className={formFieldInputPrimaryClass}
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
        <div className="space-y-2">
          <label htmlFor="password" className={formFieldLabelClass}>
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={formFieldInputWithTrailingClass('primary')}
              {...form.register('password')}
              aria-invalid={!!form.formState.errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>
        <Button
          type="submit"
          className="mt-2 h-12 w-full rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/92"
          disabled={login.isPending}
        >
          {login.isPending ? (
            'Signing in…'
          ) : (
            <>
              Sign in
              <ArrowRight className="ml-2 inline size-[18px]" aria-hidden />
            </>
          )}
        </Button>
      </form>

      <p className="mt-8 text-center">
        <Link
          href="/"
          className="text-[15px] font-semibold text-primary underline-offset-4 transition-colors hover:underline"
        >
          Back to home
        </Link>
      </p>
    </div>
  );
}
