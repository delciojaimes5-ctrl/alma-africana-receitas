const OFFENSIVE = ["merda", "porra", "caralho", "fuck", "shit"];

export function cleanText(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

export function capitalizeFirst(input: string): string {
  const t = cleanText(input);
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

export function hasOffensiveWords(input: string): boolean {
  const lower = input.toLowerCase();
  return OFFENSIVE.some((w) => new RegExp(`\\b${w}\\b`, "i").test(lower));
}
