import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="mt-auto w-full border-t border-slate-200/80 dark:border-slate-700/60 px-6 py-6">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:justify-between">
        <p>&copy; {new Date().getFullYear()} Education Lincs. Schools Compliance.</p>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-slate-100 hover:underline">
            Privacy policy
          </Link>
          <Link href="/terms" className="hover:text-slate-900 dark:hover:text-slate-100 hover:underline">
            Terms of service
          </Link>
          <a
            href="https://www.education-lincs.com/contact/contact.html"
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-900 dark:hover:text-slate-100 hover:underline"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
