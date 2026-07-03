import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { OutputTabs } from "@/components/OutputTabs";
import { formatDate, isUuid } from "@/lib/format";

export const dynamic = "force-dynamic";

interface SharedGeneration {
  id: string;
  title: string | null;
  code: string;
  framework: string;
  created_at: string;
}

async function getShared(id: string): Promise<SharedGeneration | null> {
  if (!isUuid(id)) return null;
  // Admin client bypasses RLS: anyone with the (unguessable) link can view.
  const admin = createAdminClient();
  const { data } = await admin
    .from("generations")
    .select("id, title, code, framework, created_at")
    .eq("id", id)
    .maybeSingle();
  return (data as SharedGeneration | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const gen = await getShared(id);
  const title = gen?.title
    ? `${gen.title} · Screenshot to React`
    : "Shared component · Screenshot to React";
  return { title };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const gen = await getShared(id);
  if (!gen) notFound();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <span className="font-semibold tracking-tight">Screenshot to React</span>
        <Link
          href="/"
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Make your own
        </Link>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 p-8">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {gen.title || "Shared component"}
          </h1>
          <span className="text-xs text-zinc-500">
            {formatDate(gen.created_at)} · {gen.framework}
          </span>
        </div>

        <OutputTabs code={gen.code} defaultTab="preview" />
      </main>
    </div>
  );
}
