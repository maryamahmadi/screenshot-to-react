import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

interface GenerationRow {
  id: string;
  title: string | null;
  framework: string;
  image_path: string | null;
  created_at: string;
}

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/history");

  const { data } = await supabase
    .from("generations")
    .select("id, title, framework, image_path, created_at")
    .order("created_at", { ascending: false });

  const generations = (data ?? []) as GenerationRow[];

  const items = await Promise.all(
    generations.map(async (g) => {
      let thumb: string | null = null;
      if (g.image_path) {
        const { data: signed } = await supabase.storage
          .from("screenshots")
          .createSignedUrl(g.image_path, 3600);
        thumb = signed?.signedUrl ?? null;
      }
      return { ...g, thumb };
    }),
  );

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader email={user.email} />
      <main className="mx-auto w-full max-w-6xl flex-1 p-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">
          Your generations
        </h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
            <p className="text-zinc-500">You haven&apos;t generated anything yet.</p>
            <Link
              href="/"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Create your first
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/history/${g.id}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                >
                  <div className="aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    {g.thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={g.thumb}
                        alt=""
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                        No screenshot
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 p-3">
                    <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {g.title || "Untitled"}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {formatDate(g.created_at)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
