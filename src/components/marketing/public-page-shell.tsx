import { Container } from "@/components/ui/container";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

// Shared chrome for secondary public pages (/about, /platform, /programs,
// /companies, /contact) — same header/footer as the landing page, full-width
// content container instead of the landing page's bespoke sections.
export function PublicPageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="flex flex-col gap-8 py-16 sm:py-20">{children}</Container>
      </main>
      <SiteFooter />
    </>
  );
}
