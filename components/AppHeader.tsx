import Link from "next/link";
import { signout } from "@/app/login/actions";

export function AppHeader({ email }: { email?: string | null }) {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
      <div className="flex items-center gap-5">
        <Link href="/" className="font-semibold tracking-tight">
          Screenshot to React
        </Link>
        <nav className="text-sm">
          <Link
            href="/history"
            className="text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            History
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-zinc-500">{email}</span>
        <form action={signout}>
          <button className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
