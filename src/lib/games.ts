export type GameStatus = 'live' | 'soon';

export type ArcadeGame = {
  slug: string;
  title: string;
  tagline: string;
  status: GameStatus;
  clipHook: string;
  href?: string;
};

export const ARCADE_NAME = 'Almost Fair';
export const ARCADE_TAGLINE = 'Totally fair games. We swear.';
export const ARCADE_URL = 'https://games.matthiasamire.com';
export const ARCADE_DESCRIPTION =
  'Lightweight ragebait web games made for short clips. Play Almost There, film the near-miss, share the roast — games.matthiasamire.com.';
/** Global USD support via GitHub Sponsors. */
export const BUY_ME_A_COFFEE_URL = 'https://github.com/sponsors/codydematth';
/** Naira tips from ₦500 via Paystack. */
export const PAYSTACK_TIP_URL = 'https://paystack.shop/pay/f1r8zncfcb';
/** Paste into Paystack Payment Page → Redirect URL. */
export const PAYSTACK_THANKS_URL = `${ARCADE_URL}/thanks`;
export const CREATOR_URL = 'https://matthiasamire.com';
export const CREATOR_NAME = 'Matthias Amire';
export const GITHUB_URL = 'https://github.com/codydematth/arcade';

export const GAMES: ArcadeGame[] = [
  {
    slug: 'almost-there',
    title: 'Almost There',
    tagline: 'Jump. Trust the platforms. Regret everything.',
    status: 'live',
    clipHook: 'The last jump always looks winnable.',
    href: '/almost-there',
  },
  {
    slug: 'dont-blink',
    title: "Don't Blink",
    tagline: 'Hold still. The UI will gaslight you.',
    status: 'soon',
    clipHook: 'Perfect silent reaction content.',
  },
  {
    slug: 'one-more-second',
    title: 'One More Second',
    tagline: "The timer is fair until it isn't.",
    status: 'soon',
    clipHook: 'Comment sections write themselves.',
  },
];
