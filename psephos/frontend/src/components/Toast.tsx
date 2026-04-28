"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Info, X } from "lucide-react";

interface ToastProps {
  message: string;
  sub?: string;
  type?: "success" | "info";
  duration?: number;
  onDismiss: () => void;
}

export function Toast({
  message,
  sub,
  type = "success",
  duration = 4500,
  onDismiss,
}: ToastProps) {
  const [exiting, setExiting] = useState(false);

  const dismiss = () => {
    setExiting(true);
    setTimeout(onDismiss, 220);
  };

  useEffect(() => {
    const t = setTimeout(dismiss, duration);
    return () => clearTimeout(t);
  }, [duration]);

  const isSuccess = type === "success";
  const accentColor = isSuccess ? "#00E5CC" : "#7B7EFF";
  const bgAlpha = isSuccess ? "rgba(0,229,204,0.07)" : "rgba(123,126,255,0.07)";
  const borderColor = isSuccess ? "rgba(0,229,204,0.22)" : "rgba(123,126,255,0.22)";

  return (
    <div
      className={exiting ? "toast-exit" : "toast-enter"}
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        padding: "0.875rem 1rem",
        borderRadius: "12px",
        background: "#1A1D27",
        border: `1px solid ${borderColor}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${bgAlpha}`,
        maxWidth: "340px",
        minWidth: "260px",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: bgAlpha,
          border: `1px solid ${borderColor}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {isSuccess ? (
          <CheckCircle size={15} style={{ color: accentColor }} />
        ) : (
          <Info size={15} style={{ color: accentColor }} />
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            color: "#F5F6FA",
            fontSize: "0.8125rem",
            fontWeight: 600,
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          {message}
        </p>
        {sub && (
          <p
            style={{
              color: "#8B8FA3",
              fontSize: "0.75rem",
              marginTop: "0.2rem",
              lineHeight: 1.4,
            }}
          >
            {sub}
          </p>
        )}
        {/* Progress bar */}
        <div
          style={{
            marginTop: "0.5rem",
            height: "2px",
            borderRadius: "2px",
            background: "#2A2D3A",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: "2px",
              background: accentColor,
              animation: `shrink ${duration}ms linear forwards`,
            }}
          />
        </div>
      </div>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        style={{
          background: "transparent",
          border: "none",
          color: "#4A4D5E",
          cursor: "pointer",
          padding: "2px",
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#8B8FA3")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#4A4D5E")}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
