export type GameStatus = "live" | "soon";

export type ArcadeGame = {
  slug: string;
  title: string;
  tagline: string;
  status: GameStatus;
  clipHook: string;
  href?: string;
};

export const ARCADE_NAME = "Almost Fair";
export const ARCADE_TAGLINE = "Totally fair games. We swear.";
export const ARCADE_URL = "https://games.matthiasamire.com";

export const GAMES: ArcadeGame[] = [
  {
    slug: "almost-there",
    title: "Almost There",
    tagline: "Jump. Trust the platforms. Regret everything.",
    status: "live",
    clipHook: "The last jump always looks winnable.",
    href: "/almost-there",
  },
  {
    slug: "dont-blink",
    title: "Don't Blink",
    tagline: "Hold still. The UI will gaslight you.",
    status: "soon",
    clipHook: "Perfect silent reaction content.",
  },
  {
    slug: "one-more-second",
    title: "One More Second",
    tagline: "The timer is fair until it isn't.",
    status: "soon",
    clipHook: "Comment sections write themselves.",
  },
];
