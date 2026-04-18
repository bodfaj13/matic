'use client';

import { usePathname } from 'next/navigation';

import { AgentAuthShell } from '@/components/auth/agent-auth-shell';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeTab = pathname.startsWith('/register')
    ? 'create-account'
    : 'sign-in';

  return <AgentAuthShell activeTab={activeTab}>{children}</AgentAuthShell>;
}
