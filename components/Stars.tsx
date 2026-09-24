export function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5 text-gold" aria-label={`${value} من 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < full ? "opacity-100" : "opacity-25"}>
          ★
        </span>
      ))}
    </span>
  );
}
