import { cn } from '@/lib/utils';

function TicketPreviewCard({
  tag,
  tagClass,
  id,
  title,
  snippet,
  className,
}: {
  tag: string;
  tagClass: string;
  id: string;
  title: string;
  snippet: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-stone-200/50 bg-white p-5 shadow-[0_18px_48px_-28px_rgba(25,32,72,0.14)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]',
            tagClass,
          )}
        >
          {tag}
        </span>
        <span className="text-[11px] font-medium tabular-nums tracking-wide text-stone-400">
          {id}
        </span>
      </div>
      <p className="mt-3 text-[15px] font-semibold leading-snug tracking-tight text-stone-900">
        {title}
      </p>
      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-stone-500">
        {snippet}
      </p>
    </div>
  );
}

export function AgentAuthMarketingPanel() {
  return (
    <div className="relative hidden min-h-dvh flex-col overflow-hidden bg-gradient-to-b from-[#EEF0FA] via-[#E8EAF6] to-[#DFE3F2] lg:flex">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_-10%,rgba(255,255,255,0.65),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_100%_100%,rgba(68,80,183,0.06),transparent_50%)]"
        aria-hidden
      />

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col justify-center px-8 py-14 sm:px-12 lg:px-14 lg:py-16">
        <div className="relative mx-auto w-full max-w-[min(100%,380px)]">
          <TicketPreviewCard
            tag="Urgent"
            tagClass="bg-sky-100/90 text-sky-900"
            id="ID-4921"
            title="Payment Gateway Timeout Error"
            snippet="Customers are seeing 504 errors on checkout after the latest deploy. Need immediate rollback guidance."
            className="relative z-[2]"
          />
          <div className="relative z-[1] -mt-2 px-3 sm:px-4">
            <TicketPreviewCard
              tag="Inquiry"
              tagClass="bg-stone-100 text-stone-600 ring-1 ring-inset ring-stone-200/80"
              id="ID-4920"
              title="Update billing details"
              snippet="Requesting a change to invoice recipient and tax ID before the next billing cycle."
              className="origin-top scale-[0.97] opacity-[0.72] shadow-[0_10px_30px_-20px_rgba(25,32,72,0.12)]"
            />
          </div>
        </div>

        <blockquote className="relative z-[1] mx-auto mt-14 w-full max-w-[min(100%,400px)] lg:mt-20">
          <p className="font-heading text-[1.4rem] font-semibold leading-[1.38] tracking-tight text-stone-900 sm:text-[1.65rem]">
            &ldquo;It feels less like a database, and more like a dedicated
            assistant curating exactly what needs my attention.&rdquo;
          </p>
          <footer className="mt-5 text-[13px] font-medium tracking-wide text-stone-500">
            — Director of Support, FinTech Co.
          </footer>
        </blockquote>
      </div>
    </div>
  );
}
