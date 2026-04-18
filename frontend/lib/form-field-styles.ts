import { cn } from '@/lib/utils';

/**
 * Canonical form field styling (reference: `app/(public)/submit/page.tsx`).
 * Use these class strings for new forms so inputs stay visually consistent.
 */

export const formFieldLabelClass =
  'text-[11px] font-bold uppercase tracking-[0.08em] text-stone-600';

/** White control — border darkens on focus (no ring stack; avoids double outline from base + Input defaults). */
export const formFieldInputPrimaryClass =
  'h-11 w-full rounded-xl border border-stone-200/90 bg-white shadow-none text-foreground outline-none placeholder:text-stone-400 transition-[border-color,box-shadow] focus-visible:bg-white focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:shadow-none focus-visible:border-primary/55';

/**
 * Same surface as primary: white fields on tinted cards for visual consistency
 * (subject, description, secondary auth lines, etc.).
 */
export const formFieldInputMutedClass = formFieldInputPrimaryClass;

/** White textarea — same focus treatment as inputs. */
export const formFieldTextareaMutedClass =
  'flex w-full resize-y rounded-xl border border-stone-200/90 bg-white px-3.5 py-3 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-stone-400 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:shadow-none focus-visible:border-primary/55';

/** Primary input with trailing icon slot (e.g. email check). */
export function formFieldInputPrimaryWithTrailingClass(extra?: string) {
  return cn(formFieldInputPrimaryClass, 'pr-10', extra);
}

/** Primary or muted input with trailing control (e.g. password visibility). */
export function formFieldInputWithTrailingClass(
  variant: 'primary' | 'muted',
  extra?: string,
) {
  return cn(
    variant === 'primary'
      ? formFieldInputPrimaryClass
      : formFieldInputMutedClass,
    'pr-11',
    extra,
  );
}
