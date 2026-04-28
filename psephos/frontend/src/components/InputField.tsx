"use client";

import { Info, AlertCircle } from "lucide-react";

interface Props {
  label: string;
  icon: React.ReactNode;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

export function InputField({ label, icon, hint, error, children }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-2 text-sm font-medium" style={{ color: "#F5F6FA" }}>
        <span style={{ color: "#00E5CC" }}>{icon}</span>
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="flex items-center gap-1.5 text-xs" style={{ color: "#8B8FA3" }}>
          <Info size={11} />
          {hint}
        </p>
      )}
      {error && (
        <p className="flex items-center gap-1.5 text-xs" style={{ color: "#E54D4D" }}>
          <AlertCircle size={11} />
          {error}
        </p>
      )}
    </div>
  );
}
