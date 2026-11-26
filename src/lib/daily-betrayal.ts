const BETRAYALS = [
  "Soft Launch",
  "Trust Slope",
  "VIP Lane",
  "Tutorial+",
  "Honest Gap",
  "Fairway",
  "Skill Check",
  "Almost Legal",
  "Definitely Safe",
  "Gravity Tax",
  "Blink Clause",
  "One More Pad",
] as const;

function daySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

/** Stable daily label for the arcade shelf — changes once per local day. */
export function todaysBetrayal(): string {
  const seed = daySeed();
  const index = seed % BETRAYALS.length;
  return BETRAYALS[index]!;
}

export function todaysBetrayalLine(): string {
  return `Today's betrayal: ${todaysBetrayal()}`;
}
