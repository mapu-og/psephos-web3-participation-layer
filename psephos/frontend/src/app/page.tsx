"use client";

import { useEffect, useMemo, useState } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { CONTRACT_ADDRESS, SURVEY_PLATFORM_ABI, SurveyStruct } from "@/config/contract";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { SurveyCard } from "@/components/SurveyCard";
import { StatsBar } from "@/components/StatsBar";
import { SurveyKind } from "@/lib/psephos";

type SurveyWithId = SurveyStruct & { id: bigint };
type SurveyKindSummary = {
  cid: string;
  kind: SurveyKind | null;
  status: "loading" | "ready" | "invalid-cid" | "unavailable" | "legacy";
};

export default function HomePage() {
  const router = useRouter();
  const { data: activeIds, isLoading: loadingIds, isError: idsError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SURVEY_PLATFORM_ABI,
    functionName: "getActiveSurveys",
    query: { refetchInterval: 15_000 },
  });

  const surveyContracts =
    activeIds?.map((id) => ({
      address: CONTRACT_ADDRESS,
      abi: SURVEY_PLATFORM_ABI,
      functionName: "getSurvey" as const,
      args: [id] as const,
    })) ?? [];

  const { data: surveysData, isLoading: loadingSurveys, isError: surveysError } = useReadContracts({
    contracts: surveyContracts,
    query: { enabled: !!activeIds && activeIds.length > 0, refetchInterval: 15_000 },
  });

  const surveys: SurveyWithId[] = useMemo(
    () =>
      (surveysData ?? [])
        .map((r, i) => {
          const s = r.result as SurveyStruct | undefined;
          if (!s || !activeIds) return undefined;
          return { ...s, id: activeIds[i] };
        })
        .filter((s): s is SurveyWithId => !!s)
        .sort((a, b) => (b.id > a.id ? 1 : b.id < a.id ? -1 : 0)), // newest first
    [surveysData, activeIds]
  );

  const [kindByCid, setKindByCid] = useState<Record<string, SurveyKindSummary>>({});

  const isLoading = loadingIds || loadingSurveys;
  const isError = idsError || surveysError;

  const now = Math.floor(Date.now() / 1000);
  const activeSurveys = surveys.filter(
    (s) => s.active && now <= Number(s.deadline)
  ).length;
  const totalResponses = surveys.reduce(
    (acc, s) => acc + Number(s.responseCount),
    0
  );

  useEffect(() => {
    router.prefetch("/create");
  }, [router]);

  useEffect(() => {
    if (surveys.length === 0) {
      setKindByCid({});
      return;
    }

    const controller = new AbortController();
    const cids = surveys.map((survey) => survey.ipfsHash);

    setKindByCid((current) => {
      const next = { ...current };
      cids.forEach((cid) => {
        if (!next[cid]) {
          next[cid] = { cid, kind: null, status: "loading" };
        }
      });
      return next;
    });

    const params = new URLSearchParams();
    cids.forEach((cid) => params.append("cid", cid));

    const loadKinds = async () => {
      try {
        const response = await fetch(`/api/ipfs/kinds?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        const data = (await response.json().catch(() => null)) as {
          results?: Array<SurveyKindSummary>;
        } | null;

        if (!response.ok || !data?.results) {
          throw new Error("Unable to load metadata kinds.");
        }

        setKindByCid((current) => {
          const next = { ...current };
          data.results?.forEach((result) => {
            next[result.cid] = result;
          });
          return next;
        });
      } catch (error) {
        if (controller.signal.aborted) return;

        setKindByCid((current) => {
          const next = { ...current };
          cids.forEach((cid) => {
            next[cid] = { cid, kind: null, status: "unavailable" };
          });
          return next;
        });
      }
    };

    loadKinds();
    return () => controller.abort();
  }, [surveys]);

  return (
    <div>
      {/* Hero */}
      <section className="flex flex-col items-start py-24 mb-16 gap-0">
        <div
          style={{
            color: "#F5F6FA",
            fontSize: "clamp(3.5rem, 8vw, 6rem)",
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
          }}
        >
          Ask. Poll. Vote.
        </div>
        <div
          style={{
            color: "#F5F6FA",
            fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginTop: "0.15em",
          }}
        >
          A New
        </div>
        <div
          className="mb-6"
          style={{
            color: "#00E5CC",
            fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            textShadow: "0 0 30px rgba(0,229,204,0.3)",
            marginTop: "0.1em",
          }}
        >
          Civic Layer
        </div>
        <p
          className="mb-1"
          style={{ color: "#8B8FA3", fontSize: "1.1rem", lineHeight: 1.6 }}
        >
          Vote as Immutable as Stone.
        </p>
        <p
          className="mb-10"
          style={{ color: "#8B8FA3", fontSize: "1.1rem", lineHeight: 1.6 }}
        >
          As Transparent as Blockchain.
        </p>
        <div className="flex gap-3">
          <Link href="/create" prefetch style={{ textDecoration: "none" }}>
            <button className="btn-primary flex items-center gap-2 px-6 py-3 text-sm font-semibold">
              <PlusCircle size={16} />
              Create Item
            </button>
          </Link>
          <a
            href="#surveys"
            className="flex items-center px-6 py-3 text-sm font-semibold rounded-xl"
            style={{
              color: "#00E5CC",
              border: "1px solid rgba(0,229,204,0.3)",
              background: "rgba(0,229,204,0.05)",
              textDecoration: "none",
            }}
          >
            Participate &amp; Earn
          </a>
        </div>
      </section>

      {/* Page heading */}
      <div id="surveys" className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h2
            className="mb-1"
            style={{ color: "#F5F6FA", fontSize: "1.6rem", fontWeight: 700 }}
          >
            Active Questions
          </h2>
          <p style={{ color: "#8B8FA3", fontSize: "0.875rem" }}>
            Surveys, polls, and votes with ETH-backed participation
          </p>
        </div>
        <Link href="/create" prefetch style={{ textDecoration: "none" }}>
          <button className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm font-semibold whitespace-nowrap">
            <PlusCircle size={15} />
            Create Item
          </button>
        </Link>
      </div>

      {/* Stats strip */}
      {!isLoading && !isError && surveys.length > 0 && (
        <StatsBar
          totalSurveys={surveys.length}
          activeSurveys={activeSurveys}
          totalResponses={totalResponses}
        />
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="psephos-card p-5 flex flex-col gap-4 animate-pulse"
              style={{ minHeight: "280px" }}
            >
              <div
                className="h-3 rounded"
                style={{ background: "#2A2D3A", width: "60%" }}
              />
              <div
                className="h-5 rounded"
                style={{ background: "#2A2D3A", width: "85%" }}
              />
              <div
                className="h-3 rounded"
                style={{ background: "#2A2D3A", width: "40%" }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{
            background: "rgba(229,77,77,0.07)",
            border: "1px solid rgba(229,77,77,0.25)",
          }}
        >
          <p className="text-sm" style={{ color: "#E54D4D" }}>
            Error loading surveys. Check your connection and try again.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && surveys.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(0,229,204,0.06)",
              border: "1px solid rgba(0,229,204,0.15)",
            }}
          >
            <span
              style={{
                color: "#00E5CC",
                fontSize: "2.2rem",
                textShadow: "0 0 12px rgba(0,229,204,0.5)",
              }}
            >
              ψ
            </span>
          </div>
          <div className="text-center max-w-xs">
            <p
              className="mb-1"
              style={{ color: "#F5F6FA", fontSize: "1rem", fontWeight: 600 }}
            >
              No active questions yet.
            </p>
            <p className="text-sm" style={{ color: "#8B8FA3" }}>
              Create a survey, poll, or vote to start collecting on-chain responses.
            </p>
          </div>
          <Link href="/create" prefetch style={{ textDecoration: "none" }}>
            <button className="btn-primary flex items-center gap-2 px-6 py-3 text-sm font-semibold">
              <PlusCircle size={16} />
              Create Item
            </button>
          </Link>
        </div>
      )}

      {/* Survey grid */}
      {!isLoading && !isError && surveys.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {surveys.map((survey) => {
            const kindSummary = kindByCid[survey.ipfsHash] ?? {
              cid: survey.ipfsHash,
              kind: null,
              status: "loading" as const,
            };

            return (
            <SurveyCard
              key={survey.id.toString()}
              id={survey.id}
              title={survey.title}
              rewardPerResponse={survey.rewardPerResponse}
              maxResponses={survey.maxResponses}
              responseCount={survey.responseCount}
              deadline={survey.deadline}
              active={survey.active}
              kind={kindSummary.kind}
              metadataStatus={kindSummary.status}
            />
            );
          })}
        </div>
      )}
    </div>
  );
}
