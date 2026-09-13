import { GAME_COVER_ART } from "@/lib/game-cover-art";

export default function GameCover({ id, className }: { id: string; className?: string }) {
  const art = GAME_COVER_ART[id] || GAME_COVER_ART["crown-catch"];
  const gid = `cover-${id}`;
  return (
    <svg viewBox="0 0 512 512" className={className || "game-cover"} role="img" aria-label={id}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={art.bg[0]} />
          <stop offset="1" stopColor={art.bg[1]} />
        </linearGradient>
      </defs>
      <rect width="512" height="512" fill={`url(#${gid})`} />
      <g dangerouslySetInnerHTML={{ __html: art.inner }} />
    </svg>
  );
}
