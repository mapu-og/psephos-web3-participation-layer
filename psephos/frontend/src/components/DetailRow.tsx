"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface Props {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueStyle?: React.CSSProperties;
  mono?: boolean;
  copyable?: boolean;
}

export function DetailRow({ icon, label, value, valueStyle, mono, copyable }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderBottom: "1px solid #2A2D3A" }}
    >
      <div className="flex items-center gap-2.5">
        <span style={{ color: "#8B8FA3" }}>{icon}</span>
        <span className="text-sm" style={{ color: "#8B8FA3" }}>
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="text-sm font-medium"
          style={{
            color: "#F5F6FA",
            fontFamily: mono ? "monospace" : undefined,
            fontSize: mono ? "0.8rem" : undefined,
            ...valueStyle,
          }}
        >
          {value}
        </span>
        {copyable && (
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:opacity-75 transition-opacity"
            style={{ color: "#8B8FA3" }}
            title="Copy"
          >
            {copied ? (
              <Check size={12} style={{ color: "#00E5CC" }} />
            ) : (
              <Copy size={12} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
