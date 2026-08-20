import Link from "next/link";
import { FOOTER_LINKS } from "./content";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative w-full bg-[#070709] text-white border-t border-neutral-900 overflow-hidden">
      <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20 pt-16 pb-4 flex flex-col gap-6 sm:gap-8">
        {/* Main Footer Grid (No Horizontal Line) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-3xl font-extrabold tracking-tighter text-white self-start"
            >
              <span>NOVA</span>
            </Link>
            <p className="text-sm text-neutral-400 max-w-sm leading-relaxed font-normal">
              A modern technology, education, and opportunity ecosystem connecting ambitious builders with real software execution and career pathways.
            </p>
            <div className="mt-1 flex items-center gap-3 text-xs text-neutral-400">
              <span className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/80 px-3 py-1 font-mono text-[11px]">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Ecosystem Active</span>
              </span>
            </div>
          </div>

          {/* What We Do Column */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
              What We Do
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              {FOOTER_LINKS.solutions.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-neutral-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded-xs"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Careers Column */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
              Careers
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              {FOOTER_LINKS.careers.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-neutral-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded-xs"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
              Company
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              {FOOTER_LINKS.company.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-neutral-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded-xs"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Legal & Copyright Line Directly Under the Upper Text */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs font-mono text-neutral-400">
          <p>© {year} NOVA Ecosystem. All rights reserved.</p>
          <div className="flex flex-wrap gap-6">
            {FOOTER_LINKS.legal.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="hover:text-neutral-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded-xs"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Massive Gradient Oversized Wordmark Tightened Directly Under Content */}
      <div
        aria-hidden="true"
        className="w-full overflow-hidden text-center select-none pointer-events-none -mt-4 sm:-mt-8 -mb-6 sm:-mb-12 lg:-mb-16 pt-2"
      >
        <span className="font-black text-[20vw] sm:text-[23vw] leading-none tracking-tight block uppercase bg-gradient-to-b from-white/90 via-white/40 to-transparent bg-clip-text text-transparent">
          NOVA
        </span>
      </div>
    </footer>
  );
}
