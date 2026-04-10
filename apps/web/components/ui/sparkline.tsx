"use client";

import { useId } from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  color?: string;
}

/**
 * Tiny SVG sparkline. No deps. Renders a smooth line chart with a soft gradient fill.
 * Pass an array of numbers (one per bucket); component handles scaling.
 */
export function Sparkline({
  data,
  width = 80,
  height = 24,
  className,
  color = "var(--color-accent)",
}: SparklineProps) {
  const reactId = useId();
  if (data.length === 0) {
    return <svg width={width} height={height} className={className} aria-hidden="true" />;
  }

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  // Map points to viewport
  const stepX = data.length > 1 ? width / (data.length - 1) : width;
  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height;
    return [x, y] as const;
  });

  const pathD = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  // Filled area path: line + close at bottom
  const areaD = `${pathD} L${width},${height} L0,${height} Z`;

  const gradientId = `sparkline-gradient-${reactId.replace(/[:]/g, "")}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradientId})`} />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
