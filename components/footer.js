import Link from "next/link";
import { useSession } from "next-auth/react";

function IconDoc(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
      <path fill="currentColor" d="M6 2h8l4 4v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm8 1.5V7h3.5L14 3.5zM7 11h10v2H7v-2zm0 4h10v2H7v-2z"/>
    </svg>
  );
}

function IconMail(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
      <path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5L4 8V6l8 5 8-5v2z"/>
    </svg>
  );
}

export default function Footer() {
  const { data: session } = useSession();
  if (!session) return null;

  return (
    <footer className="w-full text-white bg-[#2B2D42] border-t border-white/10 shadow-[0_-12px_30px_rgba(0,0,0,0.30)]">
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <div className="h-12 flex items-center justify-between gap-3 whitespace-nowrap">
          {/* Left */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold tracking-wide text-sm">OwaCollect</span>
            <span className="text-white/50 text-xs">© {new Date().getFullYear()}</span>
          </div>

          {/* Center links: jamais sur 2 lignes */}
          <nav className="min-w-0 flex-1 flex justify-center">
            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto flex-nowrap">
              <Link
                href="/cgu"
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 transition text-sm text-white/85 hover:text-white"
              >
                <IconDoc />
                <span className="hidden xs:inline">CGU</span>
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 transition text-sm text-white/85 hover:text-white"
              >
                <IconMail />
                <span className="hidden xs:inline">Contact</span>
              </Link>
            </div>
          </nav>

          {/* Right */}
          <div className="text-white/45 text-xs hidden sm:block">v0.2.1</div>
        </div>
      </div>
    </footer>
  );
}
