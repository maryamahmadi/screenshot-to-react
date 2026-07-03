import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { GeneratorClient } from "@/components/GeneratorClient";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader email={user?.email} />

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
