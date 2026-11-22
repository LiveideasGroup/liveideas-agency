import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="topbar">
        <span className="brand">LiveIdeas</span>
        <nav>
          <Link href="/dashboard">Overview</Link>
          <Link href="/dashboard/approvals">Approvals</Link>
          <Link href="/dashboard/pipeline">Pipeline</Link>
          <Link href="/dashboard/agents">Agents</Link>
          <Link href="/dashboard/security">Security</Link>
        </nav>
      </header>
      <div className="page">{children}</div>
    </>
  );
}
