'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { AxiosError } from 'axios';
import { Check, Leaf, Send } from 'lucide-react';
import Link from 'next/link';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { logError } from '@/app/utils/logger';
import { showError, showSuccess } from '@/app/utils/toast-helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SmartTriagePublicHeader } from '@/components/smart-triage-public-header';
import {
  formFieldInputMutedClass,
  formFieldInputPrimaryWithTrailingClass,
  formFieldLabelClass,
  formFieldTextareaMutedClass,
} from '@/lib/form-field-styles';
import { useCreateTicketMutation } from '@/lib/api/tickets/use-tickets';
import type { BaseResponse } from '@/lib/api/types';
import {
  getApiMessageFromAxiosError,
  getFieldErrorsFromApiResponse,
} from '@/lib/api/types';

const DESCRIPTION_MAX = 500;

const schema = z.object({
  title: z.string().min(1, 'Subject is required'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(
      DESCRIPTION_MAX,
      `Description must be at most ${DESCRIPTION_MAX} characters`,
    ),
  customer_email: z.string().email('Valid email required'),
});

type FormValues = z.infer<typeof schema>;

export default function SubmitTicketPage() {
  const createTicket = useCreateTicketMutation();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      customer_email: '',
    },
  });

  const emailValue =
    useWatch({ control: form.control, name: 'customer_email' }) ?? '';
  const descriptionValue =
    useWatch({ control: form.control, name: 'description' }) ?? '';
  const emailLooksValid =
    z.string().email().safeParse(emailValue.trim()).success &&
    emailValue.trim().length > 0;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const res = await createTicket.mutateAsync(values);
      showSuccess(res.message ?? 'Ticket submitted.');
      form.reset();
    } catch (err) {
      const error = err as AxiosError<BaseResponse>;
      const fieldErrors = getFieldErrorsFromApiResponse(
        error.response?.data as BaseResponse | undefined,
      );
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
    <div className="min-h-full bg-[#F9F8F7] px-4 pb-20 pt-6 text-foreground sm:px-6">
      <div className="mx-auto w-full max-w-[540px]">
        <SmartTriagePublicHeader />

        <div className="mt-10 sm:mt-14">
          <h1 className="font-heading text-[2rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[2.75rem]">
            How can we help?
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            Describe your issue below. Our AI triage system categorizes and
            routes requests to ensure you get a response typically within{' '}
            <strong className="font-semibold text-foreground">4 hours</strong>.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-10">
          <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-[#F3F2F1] shadow-[0_8px_30px_-12px_rgba(25,25,45,0.18)]">
            <div className="h-1 bg-primary" aria-hidden />
            <div className="space-y-6 p-6 sm:p-8">
              <div className="space-y-2">
                <label htmlFor="customer_email" className={formFieldLabelClass}>
                  Your email
                </label>
                <div className="relative">
                  <Input
                    id="customer_email"
                    type="email"
                    autoComplete="email"
                    placeholder="alex@example.com"
                    className={formFieldInputPrimaryWithTrailingClass()}
                    {...form.register('customer_email')}
                    aria-invalid={!!form.formState.errors.customer_email}
                  />
                  {emailLooksValid && !form.formState.errors.customer_email && (
                    <span
                      className="pointer-events-none absolute right-3 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-500 text-white"
                      aria-hidden
                    >
                      <Check className="size-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                {form.formState.errors.customer_email && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.customer_email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="title" className={formFieldLabelClass}>
                  Brief subject
                </label>
                <Input
                  id="title"
                  placeholder="e.g., Cannot access billing dashboard"
                  className={formFieldInputMutedClass}
                  {...form.register('title')}
                  aria-invalid={!!form.formState.errors.title}
                />
                {form.formState.errors.title && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <label htmlFor="description" className={formFieldLabelClass}>
                    Issue description
                  </label>
                  <span className="text-[11px] tabular-nums text-stone-400">
                    {descriptionValue.length} / {DESCRIPTION_MAX}
                  </span>
                </div>
                <textarea
                  id="description"
                  rows={7}
                  maxLength={DESCRIPTION_MAX}
                  placeholder="Please provide steps to reproduce, error codes, or any other relevant details..."
                  className={formFieldTextareaMutedClass}
                  {...form.register('description')}
                  aria-invalid={!!form.formState.errors.description}
                />
                {form.formState.errors.description && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col-reverse gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-1.5 text-[12px] text-stone-500">
                  <Leaf
                    className="size-3.5 shrink-0 text-stone-400"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  Powered by AI triage
                </p>
                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <Button
                    type="submit"
                    className="h-11 min-w-[160px] rounded-xl bg-primary px-5 font-medium text-primary-foreground shadow-none hover:bg-primary/92"
                    disabled={createTicket.isPending}
                  >
                    {createTicket.isPending ? (
                      'Sending…'
                    ) : (
                      <>
                        Submit ticket
                        <Send
                          className="ml-2 inline size-4 -translate-y-px"
                          aria-hidden
                        />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center">
            <Link
              href="/"
              className="text-[15px] font-semibold text-primary underline-offset-4 transition-colors hover:underline"
            >
              Back home
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
