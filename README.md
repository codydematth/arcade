# Almost Fair

Standalone ragebait arcade for `games.matthiasamire.com`.

Totally fair games. We swear.

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4
- Canvas 2D game engine (no Phaser)
- Web Audio SFX (no sound asset pack)

## Scripts

```bash
yarn
yarn dev
yarn lint
yarn build
yarn start
```

## Games

| Game | Status | Path |
|------|--------|------|
| Almost There | Live | `/almost-there` |
| Don't Blink | Soon | — |
| One More Second | Soon | — |

## Almost There (v1 feel)

- One-button auto-runner (tap / space)
- Dynamic seeded routes — **every fail loads a new jump path**
- **$ currency** counts up while you run; wipe to **$0** on fail (with roast)
- **Slow → fast** speed ramp as you clear more platforms
- King / Queen mascot select (saved in localStorage)
- Fake / vanish / crumble platforms
- SFX (`M`) + original chiptune music (`N`) — music off by default
- Endless procedural roast copy (shuffle bags — no external insult API)
- Silent locale detect (IP/country): **Nigeria → Pidgin + ₦**, else English + `$`
- Roast banner + **screenshot share** (clipboard image when allowed + PNG download)

## Support link

Landing footer uses `BUY_ME_A_COFFEE_URL` in `src/lib/games.ts` (default `buymeacoffee.com/codydematth`). Change the handle if yours differs.

## Deploy (`games.matthiasamire.com`)

1. Create a Vercel project from this folder.
2. Add domain `games.matthiasamire.com`.
3. Point DNS `games` CNAME to Vercel.
4. SEO ships with `/sitemap.xml`, `/robots.txt`, and Open Graph images.

## Creator posting tips

See [CONTENT.md](./CONTENT.md) — keep that advice out of the player UI.
