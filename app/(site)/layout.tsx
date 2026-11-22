import "./site.css";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site">
      <a href="#main" className="skip">Skip to content</a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </div>
  );
}
