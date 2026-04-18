import Link from 'next/link';

import { cn } from '@/lib/utils';

export function SmartTriageLogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-primary',
        className,
      )}
      aria-hidden
    >
      <span className="grid grid-cols-2 gap-0.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="size-1 rounded-[1px] bg-primary-foreground"
          />
        ))}
      </span>
    </span>
  );
}

export function SmartTriagePublicHeader() {
  return (
    <header className="flex items-center justify-between gap-4">
      <Link
        href="/"
        className="flex items-center gap-2.5 text-foreground no-underline"
      >
        <SmartTriageLogoMark />
        <span className="text-[15px] font-semibold tracking-tight">
          Smart Triage
        </span>
      </Link>
      <p className="text-right text-[13px] text-muted-foreground">
        Are you an agent?{' '}
        <Link
          href="/login"
          className="ml-0.5 inline-flex items-center rounded-lg bg-primary/10 px-2.5 py-1 text-[13px] font-semibold text-primary ring-1 ring-inset ring-primary/25 underline-offset-2 transition-colors hover:bg-primary/15 hover:text-primary hover:underline hover:ring-primary/40"
        >
          Sign in
        </Link>
      </p>
    </header>
  );
}
