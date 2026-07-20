export function SectionEmpty({ hint }: { hint: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-cream/20 px-6 py-12 text-center">
      <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">{hint}</p>
    </div>
  );
}
