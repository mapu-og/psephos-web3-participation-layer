"use client";

interface Props {
  totalSurveys: number;
  activeSurveys: number;
  totalResponses: number;
}

export function StatsBar({ totalSurveys, activeSurveys, totalResponses }: Props) {
  const stats = [
    { label: "Total Surveys", value: totalSurveys, color: "#00E5CC" },
    { label: "Active", value: activeSurveys, color: "#00E5CC" },
    { label: "Total Responses", value: totalResponses, color: "#8B8FA3" },
  ];

  return (
    <div
      className="grid grid-cols-3 gap-4 mb-10 p-4 rounded-xl"
      style={{ background: "#1A1D27", border: "1px solid #2A2D3A" }}
    >
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col items-center gap-1">
          <span
            className="text-2xl font-bold"
            style={{ color: stat.color, textShadow: `0 0 10px ${stat.color}40` }}
          >
            {stat.value}
          </span>
          <span className="text-xs" style={{ color: "#8B8FA3" }}>
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
