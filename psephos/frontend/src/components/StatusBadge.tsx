"use client";

interface Props {
  active: boolean;
  deadline: bigint; // unix timestamp
}

export function StatusBadge({ active, deadline }: Props) {
  const now = Math.floor(Date.now() / 1000);
  const isExpired = now > Number(deadline);

  const status = !active ? "closed" : isExpired ? "expired" : "active";
  const label = status === "active" ? "Active" : status === "closed" ? "Closed" : "Expired";

  return (
    <span
      className={`badge-${status} text-xs font-medium px-2.5 py-1 rounded-full`}
      style={{ letterSpacing: "0.04em", textTransform: "uppercase", fontSize: "0.65rem" }}
    >
      {label}
    </span>
  );
}
