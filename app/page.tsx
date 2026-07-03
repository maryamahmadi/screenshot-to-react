import { createClient } from "@/lib/supabase/server";
import { signout } from "./login/actions";
import { GeneratorClient } from "@/components/GeneratorClient";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <span className="font-semibold tracking-tight">Screenshot to React</span>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-zinc-500">{user?.email}</span>
          <form action={signout}>
            <button className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-8 p-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            Screenshot to React
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Drop in a UI screenshot and get a React + Tailwind component.
          </p>
        </div>
        <GeneratorClient />
      </main>
    </div>
  );
}
