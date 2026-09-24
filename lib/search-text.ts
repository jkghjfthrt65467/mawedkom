export function foldQuery(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ك/g, "ک")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function includesFold(hay: string, needle: string) {
  const q = foldQuery(needle);
  if (!q) return true;
  return foldQuery(hay).includes(q);
}
