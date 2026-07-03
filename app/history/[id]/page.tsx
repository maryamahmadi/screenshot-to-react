import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { OutputTabs } from "@/components/OutputTabs";
import { ShareButton } from "@/components/ShareButton";
import { formatDate, isUuid } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function GenerationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirectTo=/history/${id}`);

  // RLS scopes this to the current user, so a non-owner simply gets nothing.
  const { data: gen } = await supabase
    .from("generations")
    .select("id, title, code, framework, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!gen) notFound();

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader email={user.email} />
      <main className="mx-auto w-full max-w-6xl flex-1 p-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Link
              href="/history"
              className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              ← Back to history
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">
              {gen.title || "Untitled"}
            </h1>
            <span className="text-xs text-zinc-500">
              {formatDate(gen.created_at)} · {gen.framework}
            </span>
          </div>
          <ShareButton path={`/s/${gen.id}`} label="Copy share link" />
        </div>

        <OutputTabs code={gen.code} defaultTab="preview" />
      </main>
    </div>
  );
}
