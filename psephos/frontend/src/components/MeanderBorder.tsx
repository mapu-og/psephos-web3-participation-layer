import { useId } from 'react';

interface MeanderBorderProps {
  color?: string;
  height?: number;
  className?: string;
}

/**
 * Greek meander / key pattern as an SVG repeating decorative border strip.
 * The pattern unit enters and exits at the vertical midpoint so tiles seamlessly.
 */
export const MeanderBorder = ({
  color = 'rgba(0,229,204,0.22)',
  height = 14,
  className = '',
}: MeanderBorderProps) => {
  const rawId = useId();
  const patternId = `meander-${rawId.replace(/[^a-z0-9]/gi, '')}`;

  const w = 28;
  const h = 14;
  const mid = h / 2; // 7
  const d = [
    `M0,${mid}`,
    `L2,${mid}`,
    `L2,1`,
    `L9,1`,
    `L9,${h - 1}`,
    `L16,${h - 1}`,
    `L16,1`,
    `L23,1`,
    `L23,${mid}`,
    `L${w},${mid}`,
  ].join(' ');

  return (
    <div
      className={`w-full overflow-hidden ${className}`}
      style={{ height: `${height}px` }}
      aria-hidden="true"
    >
      <svg
        width="100%"
        height={height}
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={patternId}
            x="0"
            y={Math.floor((height - h) / 2)}
            width={w}
            height={h}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={d}
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
          </pattern>
        </defs>
        <rect width="100%" height={height} fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
};
