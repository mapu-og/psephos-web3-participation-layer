"use client";

import Link from "next/link";
import { formatEther } from "viem";
import { Clock, Coins, Users, ArrowRight, CircleDot } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { getKindLabel, SurveyKind } from "@/lib/psephos";

interface Props {
  id: bigint;
  title: string;
  rewardPerResponse: bigint;
  maxResponses: bigint;
  responseCount: bigint;
  deadline: bigint;
  active: boolean;
  kind: SurveyKind | null;
  metadataStatus: "loading" | "ready" | "invalid-cid" | "unavailable" | "legacy";
}

function formatDate(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SurveyCard({
  id,
  title,
  rewardPerResponse,
  maxResponses,
  responseCount,
  deadline,
  active,
  kind,
  metadataStatus,
}: Props) {
  const now = Math.floor(Date.now() / 1000);
  const isExpired = now > Number(deadline);
  const progress = Math.min((Number(responseCount) / Number(maxResponses)) * 100, 100);
  const remaining = Number(maxResponses) - Number(responseCount);
  const isFull = remaining <= 0;
  const isActiveStatus = active && !isExpired;

  const kindLabel =
    metadataStatus === "ready" && kind
      ? getKindLabel(kind)
      : metadataStatus === "loading"
        ? "Loading..."
        : "Metadata unavailable";

  const kindColor =
    metadataStatus === "ready"
      ? "#A8AAFF"
      : metadataStatus === "loading"
        ? "#8B8FA3"
        : "#F4B942";

  return (
    <div className="psephos-card p-0 flex flex-col overflow-hidden">
      {/* Cyan accent top bar */}
      <div
        style={{
          height: "3px",
          background: isActiveStatus
            ? "linear-gradient(90deg, #00E5CC, rgba(0,229,204,0.3))"
            : "linear-gradient(90deg, #2A2D3A, #2A2D3A)",
        }}
      />

      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Header row: status + deadline */}
        <div className="flex items-start justify-between gap-2">
          <StatusBadge active={active} deadline={deadline} />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Clock size={11} style={{ color: "#8B8FA3" }} />
            <span className="text-xs" style={{ color: "#8B8FA3" }}>
              {formatDate(deadline)}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3
          className="leading-snug"
          style={{ color: "#F5F6FA", fontSize: "0.95rem", fontWeight: 600 }}
        >
          {title}
        </h3>

        <div className="flex items-center gap-2">
          <CircleDot size={12} style={{ color: kindColor }} />
          <span
            style={{
              color: kindColor,
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            {kindLabel}
          </span>
        </div>

        {/* Reward */}
        <div className="flex items-center gap-2">
          <Coins size={13} style={{ color: "#00E5CC" }} />
          <span style={{ color: "#F5F6FA", fontSize: "0.85rem", fontWeight: 500 }}>
            {formatEther(rewardPerResponse)} ETH
          </span>
          <span style={{ color: "#8B8FA3", fontSize: "0.75rem" }}>/ response</span>
        </div>

        {/* Progress bar + response count */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Users size={12} style={{ color: "#8B8FA3" }} />
              <span style={{ color: "#F5F6FA", fontSize: "0.8rem", fontWeight: 500 }}>
                {responseCount.toString()}
                <span style={{ color: "#8B8FA3" }}>/{maxResponses.toString()}</span>
              </span>
            </div>
            <span style={{ color: isFull ? "#E54D4D" : "#8B8FA3", fontSize: "0.75rem" }}>
              {isFull ? "Full" : `${remaining} slots left`}
            </span>
          </div>
          <div className="progress-track" style={{ height: "5px" }}>
            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
                background: isFull ? "#E54D4D" : "#00E5CC",
                boxShadow: isFull
                  ? "0 0 6px rgba(229,77,77,0.5)"
                  : "0 0 8px rgba(0,229,204,0.4)",
              }}
            />
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* View button */}
        <Link href={`/survey/${id.toString()}`} style={{ textDecoration: "none" }}>
          <button className="btn-view w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium">
            Open Item
            <ArrowRight size={14} />
          </button>
        </Link>
      </div>
    </div>
  );
}
