export function SectionEmpty({ hint }: { hint: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-cream/40 px-6 py-10 text-center">
      <p className="text-sm text-muted italic">{hint}</p>
    </div>
  );
}
