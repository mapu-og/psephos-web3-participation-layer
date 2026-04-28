"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

interface StepperInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  min: number;
  max?: number;
  step: number;
  mode?: "integer" | "decimal";
  suffix?: string;
}

function clamp(value: number, min: number, max?: number): number {
  if (max !== undefined) return Math.min(Math.max(value, min), max);
  return Math.max(value, min);
}

function getDecimals(step: number): number {
  const stepText = step.toString();
  if (!stepText.includes(".")) return 0;
  return stepText.split(".")[1].length;
}

export function StepperInput({
  value,
  onChange,
  placeholder,
  min,
  max,
  step,
  mode = "integer",
  suffix,
}: StepperInputProps) {
  const decimals = getDecimals(step);

  const applyStep = (direction: 1 | -1) => {
    const fallback = value ? Number(value) : min;
    const base = Number.isFinite(fallback) ? fallback : min;
    const nextValue = clamp(base + step * direction, min, max);
    onChange(mode === "decimal" ? nextValue.toFixed(decimals) : String(Math.round(nextValue)));
  };

  const handleChange = (next: string) => {
    const sanitized = mode === "decimal"
      ? next.replace(/[^\d.]/g, "")
      : next.replace(/[^\d]/g, "");

    if (!sanitized) {
      onChange("");
      return;
    }

    if (mode === "decimal") {
      const [whole, fraction = ""] = sanitized.split(".");
      const normalized = fraction ? `${whole}.${fraction.slice(0, decimals)}` : whole;
      onChange(normalized);
      return;
    }

    onChange(sanitized);
  };

  const handleBlur = () => {
    if (!value) return;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return;

    const normalized = clamp(numeric, min, max);
    onChange(mode === "decimal" ? normalized.toFixed(decimals) : String(Math.round(normalized)));
  };

  return (
    <div className="stepper-shell">
      <input
        className="psephos-input stepper-input w-full px-4 py-3 text-sm"
        type="text"
        inputMode={mode === "decimal" ? "decimal" : "numeric"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") {
            e.preventDefault();
            applyStep(1);
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            applyStep(-1);
          }
        }}
        aria-label={placeholder}
      />
      {suffix && <span className="stepper-suffix">{suffix}</span>}
      <div className="stepper-controls" aria-hidden="true">
        <button type="button" className="stepper-btn" onClick={() => applyStep(1)} tabIndex={-1}>
          <ChevronUp size={13} />
        </button>
        <button type="button" className="stepper-btn" onClick={() => applyStep(-1)} tabIndex={-1}>
          <ChevronDown size={13} />
        </button>
      </div>
    </div>
  );
}
