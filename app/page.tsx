export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">
        Screenshot to React
      </h1>
      <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        Drop in a UI screenshot and get a live-rendered React + Tailwind
        component.
      </p>
    </main>
  );
}
