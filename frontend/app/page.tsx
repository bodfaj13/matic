import Link from 'next/link';

import { SmartTriagePublicHeader } from '@/components/smart-triage-public-header';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col bg-[#F9F8F7] px-4 pb-20 pt-6 text-foreground sm:px-6">
      <div className="mx-auto flex w-full max-w-[540px] flex-1 flex-col">
        <SmartTriagePublicHeader />

        <div className="mt-14 flex flex-1 flex-col sm:mt-20">
          <h1 className="font-heading text-[2rem] font-semibold leading-tight tracking-tight sm:text-[2.75rem]">
            Smart Triage
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            Customer intake and AI-assisted classification so every request
            lands with the right team—fast.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/submit"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'h-11 rounded-xl bg-primary px-6 font-medium text-primary-foreground shadow-none hover:bg-primary/92',
              )}
            >
              Submit a ticket
            </Link>
            <Link
              href="/triage"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'h-11 rounded-xl border-2 border-stone-400/70 bg-white px-6 font-semibold text-foreground shadow-none transition-colors hover:border-primary/45 hover:bg-stone-50',
              )}
            >
              Open queue
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
