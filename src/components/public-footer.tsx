import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="mt-auto w-full border-t border-slate-200/80 px-6 py-6">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 text-xs text-slate-500 sm:flex-row sm:justify-between">
        <p>&copy; {new Date().getFullYear()} Education Lincs. Schools Compliance.</p>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-slate-900 hover:underline">
            Privacy policy
          </Link>
          <Link href="/terms" className="hover:text-slate-900 hover:underline">
            Terms of service
          </Link>
          <a href="mailto:helpdesk@education-lincs.com" className="hover:text-slate-900 hover:underline">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
