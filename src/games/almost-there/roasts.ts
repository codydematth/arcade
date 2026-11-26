import type { FailReason } from "@/games/almost-there/types";
import { isHonestModeActive } from "@/lib/career";
import { formatCash, getLocale, zeroCash } from "@/lib/locale";

/**
 * Combinatorial roast engine — effectively endless.
 * No external API (CORS/NSFW/reliability issues). Shuffle bags avoid short repeats.
 */

type Bag<T> = { items: T[]; cursor: number };

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

function makeBag<T>(source: readonly T[]): Bag<T> {
  return { items: shuffleInPlace([...source]), cursor: 0 };
}

function take<T>(bag: Bag<T>, refill: readonly T[]): T {
  if (bag.cursor >= bag.items.length) {
    bag.items = shuffleInPlace([...refill]);
    bag.cursor = 0;
  }
  const value = bag.items[bag.cursor]!;
  bag.cursor += 1;
  return value;
}

const EMOJI = [
  "💀",
  "🤡",
  "😭",
  "🗑️",
  "📉",
  "🔥",
  "👻",
  "🫠",
  "🧠",
  "👀",
  "📣",
  "🍿",
  "🥱",
  "💸",
  "🚫",
  "☠️",
  "😵",
  "🤯",
  "💔",
  "🪦",
] as const;

const ADJECTIVES = [
  "CERTIFIED",
  "PREMIUM",
  "INDUSTRIAL",
  "OLYMPIC",
  "WORLD-CLASS",
  "BUDGET",
  "LIMITED-EDITION",
  "UNFORCED",
  "STREAMER",
  "MAIN-CHARACTER",
  "NPC",
  "PROFESSIONAL",
  "ILLEGAL",
  "HISTORIC",
  "CRINGE-TIER",
  "SOFT-LAUNCH",
  "HARD-PIVOT",
  "SPEEDRUN",
  "TUTORIAL",
  "SEASONAL",
] as const;

const NOUNS = [
  "LOSS",
  "SKILL ISSUE",
  "TRUST FALL",
  "AIRTIME",
  "VOID DONATION",
  "PLATFORM BETRAYAL",
  "GRAVITY TAX",
  "RECTANGLE LOSS",
  "JUMP TAX",
  "COPING ARC",
  "FAIL STREAK",
  "ALMOST",
  "NEAR-MISS",
  "EGO CHECK",
  "CLIP BAIT",
  "RATIO DELIVERY",
  "PARTICIPATION",
  "BAG WIPE",
  "FLOOR DIVORCE",
  "HIGHLIGHT REEL",
] as const;

const VERBS = [
  "OWNED",
  "COOKED",
  "FOLDED",
  "GHOSTED",
  "RATIO'D",
  "GASLIT",
  "YEETED",
  "DEMOTED",
  "EVICTED",
  "ARCHIVED",
  "REFUNDED",
  "NERFED",
  "SOFTLOCKED",
  "HARD-CARRIED",
  "UNINSTALLED",
] as const;

const TARGETS = [
  "YOU",
  "YOUR JUMP",
  "YOUR TIMING",
  "YOUR CONFIDENCE",
  "YOUR BLOODLINE",
  "YOUR GPS",
  "YOUR REFLEXES",
  "YOUR BRAND DEAL",
  "YOUR HIGHLIGHT",
  "YOUR EGO",
  "YOUR WALLET",
  "YOUR FANBASE",
] as const;

const CHAT = [
  "Chat is typing LOSS in sync",
  "Lobby donation: touch grass",
  "Viewers joined mid-fail on purpose",
  "Top comment: bro…",
  "Mods muted themselves out of respect",
  "Clip that before dignity returns",
  "Audience thriving on secondhand pain",
  "Somebody just screenshotted your ancestry",
  "Live reaction: industrial cringe",
  "Ranked: professional almost-winner",
  "Your replay looks like a PSA",
  "Chat paid to watch the bag vanish",
] as const;

const REASON_FLAVOR: Record<FailReason, readonly string[]> = {
  fell: [
    "Gravity filed a complaint",
    "The void accepted your RSVP",
    "Airtime without landing insurance",
    "You speedran meeting the floor's cousin",
  ],
  fake: [
    "That platform was decor with a PR team",
    "You high-fived a lie",
    "LARP floor. Real fall.",
    "Trust the process? The process sued you",
  ],
  vanish: [
    "The floor ghosted first",
    "Blink tax successfully collected",
    "Now you see it. Now you cope.",
    "Optical honesty: 0%",
  ],
  crumble: [
    "Floor quit mid-shift",
    "Structural vibes only",
    "HR approved the platform resignation",
    "You landed. It unemployed itself",
  ],
  timeout: [
    "Even the timer ragequit",
    "Buffering in a jump game",
    "Slow enough to age the audience",
    "AFK energy. Active consequences",
  ],
};

const CTA = [
  "RUN IT BACK",
  "TOUCH THE SCREEN",
  "ONE MORE LOSS",
  "AGAIN. COWARD.",
  "RETRY YOUR LIFE",
  "GO BROKE AGAIN",
  "FEED THE ALGORITHM",
  "DON'T LEARN",
  "PRESS FOR PAIN",
  "SPAWN CAMP YOURSELF",
] as const;

const EYEBROWS = [
  "CERTIFIED LOSS",
  "LIVE FAIL",
  "BAG WIPED",
  "MAIN CHARACTER DOWN",
  "HIGHLIGHT FAIL",
  "PUBLIC SERVICE ANNOUNCEMENT",
  "EMOTIONAL DAMAGE",
  "CLIP THIS",
  "RANKED EMBARRASSMENT",
  "DONATION ACCEPTED",
] as const;

const WIN_EYEBROWS = [
  "UNCIVILIZED WIN",
  "PATCH THIS",
  "WHO LET YOU COOK",
  "ILLEGAL W",
  "SYSTEM ERROR",
] as const;

const bags = {
  emoji: makeBag(EMOJI),
  adj: makeBag(ADJECTIVES),
  noun: makeBag(NOUNS),
  verb: makeBag(VERBS),
  target: makeBag(TARGETS),
  chat: makeBag(CHAT),
  cta: makeBag(CTA),
  eyebrow: makeBag(EYEBROWS),
  winEyebrow: makeBag(WIN_EYEBROWS),
  fell: makeBag(REASON_FLAVOR.fell),
  fake: makeBag(REASON_FLAVOR.fake),
  vanish: makeBag(REASON_FLAVOR.vanish),
  crumble: makeBag(REASON_FLAVOR.crumble),
  timeout: makeBag(REASON_FLAVOR.timeout),
};

const PIDGIN_EYEBROWS = [
  "CERTIFIED LOSS",
  "YOU DON FALL",
  "NA WA FOR YOU",
  "EGO DON SCATTER",
  "PUBLIC SHOW",
  "CHAT DEY LAUGH",
  "MONEY DON WAKA",
  "ABEG SEE THIS",
  "NAIJA PAIN",
  "FLOOR BETRAY",
  "SOFT LIFE OVER",
  "HIGHLIGHT WAHALA",
  "LIVE EMBARRASSMENT",
  "JUMP TAX PAID",
  "BAG WIPED O",
  "MAIN CHARACTER DOWN",
  "NO BE JOKE",
  "SPIRITUAL ATTACK",
  "ALMOST ENERGY",
  "BROKE HOUR",
  "I GO LIE FOR YOU",
  "DEY PLAY",
  "NA LIE!",
  "E CHOKE",
  "OMO SEE THIS",
  "GBAS GBOS",
] as const;

const PIDGIN_HEADLINES = [
  "YOU DON FALL O",
  "NA SKILL ISSUE",
  "WHO DASH YOU BOLDNESS",
  "YOUR JUMP NO CORRECT",
  "PLATFORM YARN YOU LIE",
  "GRAVITY CLAIM YOU",
  "YOU TOO TRUST",
  "FLOOR DON GHOST YOU",
  "NA DEMO BE THIS",
  "YOUR TIMING NO REACH",
  "BAG DON ZERO",
  "ALMOST THERE KE?",
  "YOU MISS AM CLEAN",
  "CONFIDENCE DON EXPIRE",
  "THAT LANDING NO LEGAL",
  "VOID DON COLLECT YOU",
  "YOUR GPS DEY LOST",
  "RECTANGLE OWN YOU",
  "YOU JUMP ENTER SCAM",
  "NEPA FOR YOUR REFLEX",
  "WHO SEND YOU?",
  "NA PARTICIPATION BE THIS",
  "YOUR EGO NEED REFUND",
  "PLATFORM SAY GOODBYE",
  "YOU DEY SPEEDRUN LOSS",
  "AIRTIME WITHOUT LANDING",
  "FLOOR RESIGN MID-SHIFT",
  "YOUR HIGHLIGHT NA PSA",
  "TRUST FALL GONE WRONG",
  "YOU DON OVERRATE YOURSELF",
  "I GO LIE FOR YOUUU?",
  "YOU FIT RUN AM?",
  "NA WA FOR YOU O BRO",
  "SHEY YOU DEY WHINE ME?",
  "DEY PLAY WITH JUMP",
  "NASO YOU LAND?",
  "OMO YOUR HAND SHAKE",
  "WAHALA LIKE BICYCLE",
  "NO BE LIE — YOU FALL",
  "E CHOKE THIS LOSS",
] as const;

const PIDGIN_SUBS = [
  "Abeg your jump no reach next block at all",
  "You dey play like say life soft",
  "Chat don start to dey roast your matter",
  "Who tell you say that platform na real?",
  "You fall like recharge card wey expire",
  "Your ancestors cover face sharp sharp",
  "Na wahala you go find for this game",
  "You land? Platform say I no dey work today",
  "See as confidence enter, see as e comot",
  "Oga your reflex dey annual leave",
  "That gap no be for your level of hope",
  "You press jump like say e go negotiate",
  "Even tutorial go shame this one",
  "Your timing arrive late like Lagos traffic",
  "The void no even charge you entry fee",
  "You almost make am — almost no be finish",
  "Floor collect your deposit and bounce",
  "Na your fingers fall first before body",
  "You dey gaslight yourself mid-air",
  "This game just show you mirror",
  "Your landing paperwork no complete",
  "Somebody for heaven dey take notes",
  "You jump with vibes, land with consequences",
  "Next time carry insurance for gravity",
  "That platform dey freelance — no loyalty",
  "I go lie for youuuuu? You fit run am next one",
  "Na wa for you o broooo — that landing no correct",
  "Shey you dey whine me ni? Platform no dey joke",
  "Dey play — that gap no be soft life",
  "As e dey sweet chat, e dey pain your fingers",
  "Abeg comot mouth — your jump no reach",
  "Naso? You yarn say you go clear am",
  "Omo mind no go touch ground after this one",
  "Wahala be like bicycle — you just pedal enter",
  "I go lie for you — even okada horn for this fall",
] as const;

const PIDGIN_AUDIENCE = [
  "People for timeline go replay this one",
  "Comment section go write 'ehn ehn'",
  "Your guy don screenshot am already",
  "Lagos wifi see this fall and pause",
  "Even roadside spectator dey clap for the loss",
  "Naija chat donation: abeg go touch grass",
  "Your group chat go title this clip 'evidence'",
  "Somebody just send am give your ex",
  "Uncle for village go ask which game be this",
  "Mods mute themselves out of respect",
  "Audience dey thrive on secondhand pain",
  "Timeline go rate this fall 10/10",
  "Your fanbase just apply for leave",
  "Even okada man go horn for this loss",
  "Comment: 'na you be this?' already trending",
  "Lobby join mid-fail on purpose",
  "Somebody clip am before dignity return",
  "Your highlight reel just collect tax",
  "People dey laugh like say NEPA bring light",
  "Chat typing LOSS in perfect sync",
  "Streets go quote 'I go lie for you' under this",
  "Comment section: na wa for you o broooo",
  "Somebody go reply 'you fit?' with tears emoji",
  "Gbas gbos don start for your mentions",
] as const;

const PIDGIN_CTA = [
  "ABEG RUN AM BACK",
  "TRY AM AGAIN NA",
  "NO FEAR, FALL AGAIN",
  "PRESS AM SHARP SHARP",
  "GO COLLECT ANOTHER LOSS",
  "COME MAKE WE LAUGH AGAIN",
  "TOUCH SCREEN, COLLECT WAHALA",
  "ONE MORE FOR THE STREETS",
  "NO LEARN ANYTHING",
  "SPAWN YOURSELF BACK",
  "FEED THE ALGORITHM AGAIN",
  "GO BROKE ONE MORE TIME",
  "PRESS FOR EXTRA PAIN",
  "RETRY YOUR LIFE NA",
  "COME PROVE SAY E FAIR",
  "ABEG NO QUIT YET",
  "JUMP ENTER ANOTHER SCAM",
  "MAKE WE SEE THE REMIX",
  "YOU FIT RUN AM?",
  "I GO LIE — TRY AM",
  "NA WA — COME BACK",
  "DEY PLAY? PRESS AGAIN",
] as const;

const PIDGIN_MONEY = [
  (peak: string, z: string) => `You get ${peak}… now ${z}`,
  (peak: string, z: string) => `${peak} don scatter for air — balance ${z}`,
  (peak: string, z: string) => `Account: ${peak} → ${z} sharp sharp`,
  (peak: string, z: string) => `You donate ${peak} give void. Left: ${z}`,
  (peak: string, z: string) => `${peak} wipe finish like NEPA light (${z})`,
  (peak: string, z: string) => `Wallet talk: ${peak} become ${z}`,
  (peak: string, z: string) => `${peak} waka comot without bye-bye. Now ${z}`,
  (peak: string, z: string) => `You hold ${peak}. Floor collect am. ${z}`,
  (peak: string, z: string) => `Bank alert reverse: ${peak} → ${z}`,
  (peak: string, z: string) => `${peak} vanish faster than data bundle → ${z}`,
  (peak: string, z: string) => `Your ${peak} just pay gravity tax. Balance ${z}`,
  (peak: string, z: string) => `Rich for 2 seconds (${peak}). Now ${z}`,
] as const;

const PIDGIN_WIN_EYEBROWS = [
  "UNCIVILIZED WIN",
  "NA SCAM WIN",
  "WHO LET YOU?",
  "SYSTEM ERROR O",
  "ILLEGAL W",
] as const;

const PIDGIN_WIN_HEADLINES = [
  "YOU WIN? NA SCAM",
  "PATCH THIS SHARP",
  "WHO APPROVE THIS W?",
  "GAME DEY CONFUSED",
  "YOU DON BREAK PHYSICS",
  "I GO LIE — YOU WIN?",
  "E CHOKE THIS W",
  "YOU FIT DO AM AGAIN?",
] as const;

const PIDGIN_WIN_SUBS = [
  "You break the part wey you suppose lose",
  "Even the platform no expect this nonsense",
  "Admin for heaven dey reload the level",
  "You win like say e no be ragebait",
  "This one no enter the script at all",
  "I go lie for youuu? You actually clear am",
  "Na wa o — even Fair™ dey confuse",
  "Shey you dey whine me? That W look illegal",
] as const;

const PIDGIN_WIN_AUDIENCE = [
  "Everybody for lobby dey confused",
  "Chat freeze like say NEPA comot light",
  "People dey argue say replay fake",
  "Mods dey check if you hack",
] as const;

const PIDGIN_WIN_CTA = [
  "DO AM AGAIN",
  "PROVE SAY E NO BE LUCK",
  "RUN THE GLITCH BACK",
  "COME COLLECT BAN",
] as const;

/** Honest Mode — skill roasts, no “platform scam” gaslight. */
const HONEST_LOSS_EYEBROWS = [
  "SKILL CHECK",
  "TIMING TAX",
  "CLEAN MISS",
  "NO SCAM NEEDED",
  "GAPS WON",
  "REFLEX LEFT",
] as const;

const HONEST_LOSS_HEADLINES = [
  "YOUR JUMP NO REACH",
  "NA TIMING BE THIS",
  "GAPS STILL DEY",
  "PLATFORM NO LIE",
  "YOU MISS AM CLEAN",
  "HAND SHAKE LATE",
  "SKILL ISSUE HONEST",
  "STREAK BREAKER",
] as const;

const HONEST_LOSS_HEADLINES_EN = [
  "PURE TIMING",
  "GAP WINS",
  "CLEAN MISS",
  "NO SCAMS HERE",
  "SKILL CHECK FAILED",
  "STREAK BROKEN",
  "LATE JUMP",
  "HONEST L",
] as const;

const HONEST_WIN_EYEBROWS = [
  "CLEAN CLEAR",
  "SKILL ONLY",
  "STREAK FUEL",
  "CERTIFIED HONEST",
] as const;

const HONEST_WIN_HEADLINES = [
  "YOU CLEAR AM CLEAN",
  "NO SCAM ASSIST",
  "STREAK DEY GROW",
  "HONEST W",
  "TIMING CORRECT",
] as const;

const HONEST_WIN_HEADLINES_EN = [
  "CLEAN CLEAR",
  "NO SCAM ASSIST",
  "STREAK UP",
  "HONEST W",
  "TIMING LOCKED",
] as const;

const pidginBags = {
  eyebrow: makeBag(PIDGIN_EYEBROWS),
  headline: makeBag(PIDGIN_HEADLINES),
  sub: makeBag(PIDGIN_SUBS),
  audience: makeBag(PIDGIN_AUDIENCE),
  cta: makeBag(PIDGIN_CTA),
  money: makeBag(PIDGIN_MONEY),
  winEyebrow: makeBag(PIDGIN_WIN_EYEBROWS),
  winHeadline: makeBag(PIDGIN_WIN_HEADLINES),
  winSub: makeBag(PIDGIN_WIN_SUBS),
  winAudience: makeBag(PIDGIN_WIN_AUDIENCE),
  winCta: makeBag(PIDGIN_WIN_CTA),
};

function isPidgin(): boolean {
  return getLocale().dialect === "pidgin";
}

function isHonest(): boolean {
  return isHonestModeActive();
}

export type ProgressBand = "early" | "mid" | "late" | "near";

export function progressBand(progress: number): ProgressBand {
  if (progress >= 0.9) return "near";
  if (progress >= 0.7) return "late";
  if (progress >= 0.4) return "mid";
  return "early";
}

export function nextEmoji(): string {
  return take(bags.emoji, EMOJI);
}

function pickLine(pool: readonly string[]): string {
  return pool[Math.floor(Math.random() * pool.length)]!;
}

/** Soft-sounding ragebait when the finish line was right there. */
const NEAR_EYEBROWS_PIDGIN = [
  "NA SMALL REMAIN",
  "FINISH LINE TAX",
  "YOU SEE AM",
  "ALMOST COLLECT",
  "WHY NOW?",
  "FLAG DEY LAUGH",
] as const;

const NEAR_EYEBROWS_EN = [
  "SO CLOSE IT HURTS",
  "FINISH LINE TAX",
  "ONE PAD LEFT",
  "CRIMINAL NEAR-MISS",
  "WHY THERE?",
  "FLAG WAS WATCHING",
] as const;

const NEAR_HEADLINES_PIDGIN = [
  "OMO YOU TRY O",
  "NA SMALL REMAIN",
  "WATIN YOU DEY THINK?",
  "YOU SEE THE FLAG?",
  "WHY YOU FALL NOW?",
  "I BELIEVE YOU… ALMOST",
  "FINISH LINE DON MOCK YOU",
  "SMALL REMAIN MAKE YOU WIN",
  "YOU ALMOST COLLECT AM",
  "NA YOUR HAND BETRAY YOU",
] as const;

const NEAR_HEADLINES_EN = [
  "YOU WERE RIGHT THERE",
  "ONE MORE JUMP",
  "THE FLAG SAW YOU",
  "WHY FALL THERE?",
  "SO CLOSE IT'S ILLEGAL",
  "ALMOST DOESN'T COUNT",
  "FINISH LINE SAID NOPE",
  "YOUR HANDS QUIT FIRST",
  "THAT WAS THE LAST GAP",
  "EMOTIONAL DAMAGE",
] as const;

const NEAR_CTA_PIDGIN = [
  "I BELIEVE YOU GO RUN AM",
  "TRY AGAIN — NA SMALL",
  "COME COLLECT AM ABEG",
  "RUN AM BACK SHARP",
  "NO QUIT FOR HERE",
] as const;

const NEAR_CTA_EN = [
  "I BELIEVE IN YOU — RETRY",
  "ONE MORE — YOU GOT THIS",
  "GO FINISH IT",
  "RUN IT BACK",
  "DON'T LEAVE IT HERE",
] as const;

const LATE_EYEBROWS_PIDGIN = [
  "LATE GAME PAIN",
  "ALMOST ENERGY",
  "E PAIN YOU",
  "CLOSE BUT NO",
] as const;

const LATE_EYEBROWS_EN = [
  "LATE GAME PAIN",
  "ALMOST ENERGY",
  "CLOSE BUT NO",
  "HURTS DIFFERENT",
] as const;

const LATE_HEADLINES_PIDGIN = [
  "YOU DEY CLOSE O",
  "E PAIN FOR REAL",
  "ALMOST NO BE FINISH",
  "LATE GAME DON COLLECT YOU",
  "YOUR HOPE REACH FAR",
  "NA WA — YOU ALMOST",
] as const;

const LATE_HEADLINES_EN = [
  "LATE GAME BETRAYAL",
  "HOPE GOT YOU KILLED",
  "ALMOST IS A TRAP",
  "SO FAR FOR THIS?",
  "PAIN WITH PROGRESS",
  "CLOSE ENOUGH TO HURT",
] as const;

const MID_HEADLINES_PIDGIN = [
  "MID WAHALA",
  "YOU STILL DEY LEARN",
  "HALFWAY SHAME",
  "NO BE FINISH LINE",
  "YOUR CONFIDENCE EXPIRE",
] as const;

const MID_HEADLINES_EN = [
  "MID-RUN COLLAPSE",
  "HALFWAY SHAME",
  "TUTORIAL ENERGY STILL",
  "CONFIDENCE EXPIRED",
  "NOT EVEN CLOSE ENOUGH",
] as const;

const EARLY_HEADLINES_PIDGIN = [
  "YOU FALL EARLY O",
  "TUTORIAL STILL DEY?",
  "START PAD OWN YOU",
  "WHO SEND YOU?",
  "SOFT OPENING LOSS",
] as const;

const EARLY_HEADLINES_EN = [
  "EARLY EXIT",
  "TUTORIAL VICTIM",
  "OPENING ACT FLOP",
  "WHO SENT YOU?",
  "SOFT LAUNCH LOSS",
] as const;

export function nextEyebrow(won: boolean, progress = 0): string {
  if (won) {
    if (isHonest()) return pickLine(HONEST_WIN_EYEBROWS);
    return isPidgin()
      ? take(pidginBags.winEyebrow, PIDGIN_WIN_EYEBROWS)
      : take(bags.winEyebrow, WIN_EYEBROWS);
  }

  const band = progressBand(progress);
  const pct = Math.round(progress * 100);

  if (band === "near") {
    // Mix % stamp with emotional eyebrow
    if (Math.random() > 0.45) {
      return isPidgin() ? `${pct}% PAIN` : `${pct}% CLOSE`;
    }
    return isPidgin()
      ? pickLine(NEAR_EYEBROWS_PIDGIN)
      : pickLine(NEAR_EYEBROWS_EN);
  }
  if (band === "late") {
    return isPidgin()
      ? pickLine(LATE_EYEBROWS_PIDGIN)
      : pickLine(LATE_EYEBROWS_EN);
  }
  if (isHonest()) return pickLine(HONEST_LOSS_EYEBROWS);
  if (isPidgin()) return take(pidginBags.eyebrow, PIDGIN_EYEBROWS);
  return take(bags.eyebrow, EYEBROWS);
}

export function nextHeadline(
  won: boolean,
  reason: FailReason,
  progress = 0,
): string {
  if (won) {
    if (isHonest()) {
      return isPidgin()
        ? pickLine(HONEST_WIN_HEADLINES)
        : pickLine(HONEST_WIN_HEADLINES_EN);
    }
    return isPidgin()
      ? take(pidginBags.winHeadline, PIDGIN_WIN_HEADLINES)
      : `${take(bags.adj, ADJECTIVES)} WIN`;
  }

  const band = progressBand(progress);

  // Near-finish emotion wins over generic / fail-reason roast.
  if (band === "near") {
    return isPidgin()
      ? pickLine(NEAR_HEADLINES_PIDGIN)
      : pickLine(NEAR_HEADLINES_EN);
  }
  if (band === "late") {
    return isPidgin()
      ? pickLine(LATE_HEADLINES_PIDGIN)
      : pickLine(LATE_HEADLINES_EN);
  }
  if (band === "mid") {
    if (isHonest()) {
      return isPidgin()
        ? pickLine(HONEST_LOSS_HEADLINES)
        : pickLine(HONEST_LOSS_HEADLINES_EN);
    }
    return isPidgin()
      ? pickLine(MID_HEADLINES_PIDGIN)
      : pickLine(MID_HEADLINES_EN);
  }

  // Early: fail-reason flavor still useful on Fair™ scams.
  if (!isHonest() && (reason === "fake" || reason === "vanish" || reason === "crumble")) {
    if (isPidgin()) return take(pidginBags.headline, PIDGIN_HEADLINES);
    return `${take(bags.adj, ADJECTIVES)} ${take(bags.noun, NOUNS)}`;
  }
  if (isHonest()) {
    return isPidgin()
      ? pickLine(HONEST_LOSS_HEADLINES)
      : pickLine(HONEST_LOSS_HEADLINES_EN);
  }
  return isPidgin()
    ? pickLine(EARLY_HEADLINES_PIDGIN)
    : pickLine(EARLY_HEADLINES_EN);
}

export function nextSubline(
  won: boolean,
  reason: FailReason,
  moneyLost: number,
): string {
  const z = zeroCash();
  if (won) {
    return isPidgin()
      ? `${nextEmoji()} ${take(pidginBags.winSub, PIDGIN_WIN_SUBS)}`
      : `${nextEmoji()} You broke the bit where you're supposed to lose.`;
  }
  if (moneyLost > 0 && Math.random() > 0.3) {
    const peak = formatCash(moneyLost);
    if (isPidgin()) {
      const line = take(pidginBags.money, PIDGIN_MONEY)(peak, z);
      return `${line} ${nextEmoji()}`;
    }
    const lines = [
      `You had ${peak}… now ${z} ${nextEmoji()}`,
      `${peak} evaporated mid-air ${nextEmoji()}`,
      `Bank: ${peak} → emotional support ${z}`,
      `Donated ${peak} to the void ${nextEmoji()}`,
      `${peak} wiped harder than your landing`,
    ];
    return lines[Math.floor(Math.random() * lines.length)]!;
  }
  if (isPidgin()) {
    return `${take(pidginBags.sub, PIDGIN_SUBS)} ${nextEmoji()}`;
  }
  const flavor = take(bags[reason], REASON_FLAVOR[reason]);
  const chatty = take(bags.chat, CHAT);
  return Math.random() > 0.5
    ? `${flavor} ${nextEmoji()}`
    : `${chatty} ${nextEmoji()}`;
}

export function nextAudience(won: boolean): string {
  if (won) {
    return isPidgin()
      ? `${nextEmoji()} ${take(pidginBags.winAudience, PIDGIN_WIN_AUDIENCE)}`
      : `${nextEmoji()} Lobby status: confused and violent`;
  }
  if (isPidgin()) {
    return `${nextEmoji()} ${take(pidginBags.audience, PIDGIN_AUDIENCE)}`;
  }
  return `${nextEmoji()} ${take(bags.chat, CHAT)}`;
}

export function nextCta(won: boolean, progress = 0): string {
  if (won) {
    if (isHonest()) {
      return `${nextEmoji()} STACK THE STREAK`;
    }
    return isPidgin()
      ? `${nextEmoji()} ${take(pidginBags.winCta, PIDGIN_WIN_CTA)}`
      : `${nextEmoji()} DO IT AGAIN`;
  }

  const band = progressBand(progress);
  if (band === "near") {
    return `${nextEmoji()} ${
      isPidgin() ? pickLine(NEAR_CTA_PIDGIN) : pickLine(NEAR_CTA_EN)
    }`;
  }
  if (isHonest()) {
    return isPidgin()
      ? `${nextEmoji()} RUN AM BACK CLEAN`
      : `${nextEmoji()} RUN IT BACK CLEAN`;
  }
  if (isPidgin()) {
    return `${nextEmoji()} ${take(pidginBags.cta, PIDGIN_CTA)}`;
  }
  return `${nextEmoji()} ${take(bags.cta, CTA)}`;
}

export function nextShare(won: boolean, progress = 0): string {
  const pct = Math.round(progress * 100);
  if (won) {
    if (isHonest()) {
      return isPidgin()
        ? `${nextEmoji()} Honest Mode clear for Almost There. No scam assist.`
        : `${nextEmoji()} Honest Mode clear on Almost There. No scam assist.`;
    }
    return isPidgin()
      ? `${nextEmoji()} I beat Almost There. Ban me abeg.`
      : `${nextEmoji()} I beat Almost There. Ban me.`;
  }

  if (progressBand(progress) === "near") {
    return isPidgin()
      ? `${nextEmoji()} Almost There — ${pct}%. Na small remain make I win. Watin I dey think?`
      : `${nextEmoji()} Almost There — ${pct}%. I was right there. Emotional damage.`;
  }

  if (isHonest()) {
    return isPidgin()
      ? `${nextEmoji()} Honest Mode still collect me — na skill this time`
      : `${nextEmoji()} Honest Mode got me — pure skill miss`;
  }
  if (isPidgin()) {
    return `${nextEmoji()} this "fair" game just collect my loss for Naija`;
  }
  return `${nextEmoji()} just got ${take(bags.verb, VERBS).toLowerCase()} by a "fair" platformer`;
}
