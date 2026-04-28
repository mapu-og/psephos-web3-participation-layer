"use client";

import { ExternalLink } from "lucide-react";

interface Props {
  hash: string;
}

function truncateHash(hash: string, start = 18, end = 10): string {
  if (hash.length <= start + end) return hash;
  return `${hash.slice(0, start)}…${hash.slice(-end)}`;
}

export function TxHashDisplay({ hash }: Props) {
  return (
    <div
      className="flex flex-col gap-1.5 p-3 rounded-lg mt-3"
      style={{ background: "#0F1117", border: "1px solid #2A2D3A" }}
    >
      <p className="text-xs" style={{ color: "#8B8FA3" }}>
        Transaction confirmed
      </p>
      <a
        href={`https://sepolia.basescan.org/tx/${hash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs hover:opacity-75 transition-opacity"
        style={{ color: "#00E5CC", fontFamily: "monospace", wordBreak: "break-all" }}
      >
        {truncateHash(hash, 18, 10)}
        <ExternalLink size={11} className="flex-shrink-0" />
      </a>
    </div>
  );
}
