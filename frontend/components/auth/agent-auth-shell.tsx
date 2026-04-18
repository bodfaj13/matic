import Link from 'next/link';

import { AgentAuthMarketingPanel } from '@/components/auth/agent-auth-marketing-panel';
import { SmartTriageLogoMark } from '@/components/smart-triage-public-header';
import { cn } from '@/lib/utils';

export type AgentAuthTab = 'sign-in' | 'create-account';

function FooterLink({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) {
  return (
    <a
      href={href}
      className="text-[13px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
    >
      {children}
    </a>
  );
}

export function AgentAuthShell({
  activeTab,
  children,
}: {
  activeTab: AgentAuthTab;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh w-full grid-cols-1 overflow-hidden bg-[#F9F8F7] lg:grid-cols-2">
      <div className="flex min-h-dvh flex-col overflow-hidden px-5 pb-6 pt-6 sm:px-10 sm:pb-8 sm:pt-8 lg:px-14 lg:pb-10 lg:pt-10">
        <div className="mx-auto flex w-full max-w-[440px] min-h-0 flex-1 flex-col">
          <Link
            href="/"
            className="flex w-fit shrink-0 items-center gap-2.5 text-foreground no-underline"
          >
            <SmartTriageLogoMark />
            <span className="text-[15px] font-semibold tracking-tight">
              Smart Triage
            </span>
          </Link>

          <div className="mt-8 flex shrink-0 gap-8 border-b border-stone-200/80 sm:gap-12">
            <Link
              href="/register"
              className={cn(
                '-mb-px border-b-[3px] border-transparent pb-3.5 text-[15px] font-semibold tracking-tight transition-colors',
                activeTab === 'create-account'
                  ? 'border-primary text-foreground'
                  : 'text-stone-700 hover:border-stone-300 hover:text-foreground',
              )}
            >
              Create Account
            </Link>
            <Link
              href="/login"
              className={cn(
                '-mb-px border-b-[3px] border-transparent pb-3.5 text-[15px] font-semibold tracking-tight transition-colors',
                activeTab === 'sign-in'
                  ? 'border-primary text-foreground'
                  : 'text-stone-700 hover:border-stone-300 hover:text-foreground',
              )}
            >
              Sign In
            </Link>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-8 lg:py-10">
            {children}
          </div>

          <div className="shrink-0 border-t border-stone-200/70 pt-5">
            {activeTab === 'create-account' ? (
              <p className="text-center text-[12px] leading-relaxed text-muted-foreground sm:text-left">
                By creating an account, you agree to our{' '}
                <FooterLink href="https://example.com/terms">
                  Terms of Service
                </FooterLink>{' '}
                and{' '}
                <FooterLink href="https://example.com/privacy">
                  Privacy Policy
                </FooterLink>
                .
              </p>
            ) : (
              <p className="text-center text-[12px] text-muted-foreground sm:text-left">
                Agent credentials are required to access the triage queue.
              </p>
            )}
          </div>
        </div>
      </div>

      <AgentAuthMarketingPanel />
    </div>
  );
}
