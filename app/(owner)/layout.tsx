import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Control room",
  robots: { index: false, follow: false },
};

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
