import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "LiveIdeas control room",
  description: "Live view of the agents running the LiveIdeas AI consultancy",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        <header className="topbar">
          <span className="brand">LiveIdeas</span>
          <nav>
            <Link href="/">Overview</Link>
            <Link href="/approvals">Approvals</Link>
            <Link href="/pipeline">Pipeline</Link>
            <Link href="/agents">Agents</Link>
            <Link href="/security">Security</Link>
          </nav>
        </header>
        <div className="page">{children}</div>
      </body>
    </html>
  );
}
