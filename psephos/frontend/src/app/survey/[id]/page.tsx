"use client";

import { useReadContract, useWaitForTransactionReceipt, useAccount, usePublicClient, useWriteContract } from "wagmi";
import {
  CONTRACT_ADDRESS,
  CONTRACT_DEPLOYMENT_BLOCK,
  SURVEY_PLATFORM_ABI,
  SurveyStruct,
  ResponseStruct,
} from "@/config/contract";
import { formatEther } from "viem";
import { baseSepolia } from "wagmi/chains";
import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import {
  ArrowLeft,
  Coins,
  Users,
  Calendar,
  Check,
  Gift,
  AlertCircle,
  Send,
  Wallet,
  Activity,
  ExternalLink,
  FileText,
  ShieldCheck,
  CircleDot,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { DetailRow } from "@/components/DetailRow";
import { TxHashDisplay } from "@/components/TxHashDisplay";
import { MeanderBorder } from "@/components/MeanderBorder";
import { Toast } from "@/components/Toast";
import {
  buildIpfsUrl,
  fetchIpfsJson,
  getKindLabel,
  getParticipationHeading,
  getRespondAction,
  getTypeSummary,
  isResponsePayloadV1,
  isSurveyMetadataV1,
  isValidIpfsCid,
  ResponsePayloadV1,
  SurveyKind,
  SurveyMetadataV1,
} from "@/lib/psephos";

interface Props {
  params: { id: string };
}

type HistoryItem = {
  type: string;
  label: string;
  actorLabel: string;
  detail: string;
  txHash?: `0x${string}`;
  ts: bigint;
  actor?: string;
};

type IpfsUploadResponse = {
  cid: string;
};

const LOG_RANGE = BigInt(9_500);
const ONE_BLOCK = BigInt(1);

function truncateHash(hash: string, start = 8, end = 6): string {
  if (hash.length <= start + end) return hash;
  return `${hash.slice(0, start)}…${hash.slice(-end)}`;
}

function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatDate(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatHistoryDate(timestamp: bigint): string {
  if (!timestamp) return "Pending";
  return new Date(Number(timestamp) * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatHistoryAge(timestamp: bigint): string {
  if (!timestamp) return "--";

  const secondsAgo = Math.max(0, Math.floor(Date.now() / 1000) - Number(timestamp));

  if (secondsAgo < 60) return `${secondsAgo}s ago`;

  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) return `${minutesAgo}m ago`;

  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) return `${hoursAgo}h ago`;

  const daysAgo = Math.floor(hoursAgo / 24);
  if (daysAgo < 30) return `${daysAgo}d ago`;

  const monthsAgo = Math.floor(daysAgo / 30);
  if (monthsAgo < 12) return `${monthsAgo}mo ago`;

  const yearsAgo = Math.floor(monthsAgo / 12);
  return `${yearsAgo}y ago`;
}

function parseContractError(error: Error | null | undefined): string {
  if (!error) return "";
  const raw = [error.message, String((error as { cause?: unknown }).cause ?? "")].join(" ");

  if (raw.includes("AlreadyResponded")) return "You already responded to this item.";
  if (raw.includes("SurveyNotActive")) return "This item is no longer active.";
  if (raw.includes("MaxResponsesReached")) return "This item has reached its maximum number of responses.";
  if (raw.includes("InvalidSurveyId")) return "Invalid item ID.";
  if (raw.includes("SurveyExpired")) return "The deadline for this item has passed.";
  if (raw.includes("DidNotRespond")) return "You need to respond before claiming.";
  if (raw.includes("AlreadyClaimed")) return "You have already claimed your reward.";
  if (/exceeds.{0,40}gas|gas.{0,40}exceeds/i.test(raw)) {
    return "Gas estimation failed — the item may be closed, full, or already answered.";
  }
  if (/user rejected|User rejected/i.test(raw)) return "Transaction cancelled.";

  return "Transaction failed. Please try again.";
}

function summarizeResponse(payload: ResponsePayloadV1 | null): string | null {
  if (!payload) return null;

  if (payload.response.type === "open-text") {
    const text = payload.response.text.trim();
    if (!text) return null;
    return text.length > 120 ? `${text.slice(0, 117)}...` : text;
  }

  return payload.response.optionLabel;
}

async function uploadJsonPayload(route: string, payload: unknown): Promise<IpfsUploadResponse> {
  const response = await fetch(route, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as { cid?: string; error?: string } | null;

  if (!response.ok || !data?.cid) {
    throw new Error(data?.error ?? "Unable to upload payload to IPFS.");
  }

  return { cid: data.cid };
}

export default function SurveyDetailPage({ params }: Props) {
  const surveyId = BigInt(params.id);
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [responseText, setResponseText] = useState("");
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [toast, setToast] = useState<{ message: string; sub?: string } | null>(null);
  const [history, setHistory] = useState<HistoryItem[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [metadata, setMetadata] = useState<SurveyMetadataV1 | null>(null);
  const [metadataStatus, setMetadataStatus] = useState<
    "idle" | "loading" | "ready" | "invalid-cid" | "unavailable" | "legacy"
  >("idle");
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [responsePayload, setResponsePayload] = useState<ResponsePayloadV1 | null>(null);
  const [responsePayloadLoading, setResponsePayloadLoading] = useState(false);
  const [preparingResponse, setPreparingResponse] = useState(false);
  const [submitHash, setSubmitHash] = useState<`0x${string}` | undefined>();
  const [claimHash, setClaimHash] = useState<`0x${string}` | undefined>();
  const [localResponseCid, setLocalResponseCid] = useState<string | null>(null);

  const {
    data: survey,
    isLoading: surveyLoading,
    isError: surveyError,
    refetch: refetchSurvey,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SURVEY_PLATFORM_ABI,
    functionName: "getSurvey",
    args: [surveyId],
    query: { refetchInterval: 15_000 },
  });

  const { data: responded, refetch: refetchResponded } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SURVEY_PLATFORM_ABI,
    functionName: "hasResponded",
    args: [surveyId, address!],
    query: { enabled: !!address, refetchInterval: 15_000 },
  });

  const { data: responseData, refetch: refetchResponseData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SURVEY_PLATFORM_ABI,
    functionName: "getResponse",
    args: [surveyId, address!],
    query: { enabled: !!address && !!responded, refetchInterval: 15_000 },
  });

  const responseStruct = responseData as ResponseStruct | undefined;
  const claimed = responseStruct?.claimed ?? false;
  const normalizedAddress = address?.toLowerCase();

  const {
    writeContractAsync: submitContractAsync,
    isPending: submitPending,
    error: submitWriteError,
  } = useWriteContract();

  const {
    writeContractAsync: claimContractAsync,
    isPending: claimPending,
    error: claimWriteError,
  } = useWriteContract();

  const { isLoading: submitConfirming, isSuccess: submitSuccess } =
    useWaitForTransactionReceipt({ hash: submitHash });

  const { isLoading: claimConfirming, isSuccess: claimSuccess } =
    useWaitForTransactionReceipt({ hash: claimHash });

  useEffect(() => {
    setResponseText("");
    setSelectedOptionId("");
    setSubmitError(null);
    setLocalResponseCid(null);
    setResponsePayload(null);
  }, [surveyId]);

  useEffect(() => {
    if (!survey) return;
    let cancelled = false;

    const loadMetadata = async () => {
      const currentSurvey = survey as SurveyStruct;

      if (!isValidIpfsCid(currentSurvey.ipfsHash)) {
        if (!cancelled) {
          setMetadata(null);
          setMetadataStatus("invalid-cid");
          setMetadataLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setMetadataStatus("loading");
      }

      setMetadataLoading(true);
      try {
        const raw = await fetchIpfsJson<unknown>(currentSurvey.ipfsHash);
        if (!cancelled && isSurveyMetadataV1(raw)) {
          setMetadata(raw);
          setMetadataStatus("ready");
          const firstOptionId = raw.options?.[0]?.id ?? "";
          if (raw.kind !== "survey" && firstOptionId) {
            setSelectedOptionId((current) => current || firstOptionId);
          }
        } else if (!cancelled) {
          setMetadata(null);
          setMetadataStatus("legacy");
        }
      } catch {
        if (!cancelled) {
          setMetadata(null);
          setMetadataStatus("unavailable");
        }
      } finally {
        if (!cancelled) setMetadataLoading(false);
      }
    };

    loadMetadata();
    return () => {
      cancelled = true;
    };
  }, [survey]);

  const responseCid = localResponseCid ?? responseStruct?.answerHash ?? null;

  useEffect(() => {
    if (!responseCid) {
      setResponsePayload(null);
      setResponsePayloadLoading(false);
      return;
    }

    if (!isValidIpfsCid(responseCid)) {
      setResponsePayload(null);
      setResponsePayloadLoading(false);
      return;
    }

    let cancelled = false;

    const loadResponsePayload = async () => {
      setResponsePayloadLoading(true);
      try {
        const raw = await fetchIpfsJson<unknown>(responseCid);
        if (!cancelled && isResponsePayloadV1(raw)) {
          setResponsePayload(raw);
        } else if (!cancelled) {
          setResponsePayload(null);
        }
      } catch {
        if (!cancelled) setResponsePayload(null);
      } finally {
        if (!cancelled) setResponsePayloadLoading(false);
      }
    };

    loadResponsePayload();
    return () => {
      cancelled = true;
    };
  }, [responseCid]);

  useEffect(() => {
    if (submitSuccess) {
      setHasSubmitted(true);
      setToast({
        message: metadata?.kind === "vote" ? "Vote recorded!" : "Response submitted!",
        sub: "Your submission is now referenced on-chain.",
      });
      setTimeout(() => {
        refetchSurvey();
        refetchResponded();
        refetchResponseData();
      }, 2000);
    }
  }, [submitSuccess, metadata?.kind, refetchResponded, refetchResponseData, refetchSurvey]);

  useEffect(() => {
    if (claimSuccess) {
      setHasClaimed(true);
      setToast({ message: "Reward claimed!", sub: `${rewardEth} ETH sent to your wallet.` });
      setTimeout(() => {
        refetchSurvey();
        refetchResponseData();
      }, 2000);
    }
  }, [claimSuccess, refetchResponseData, refetchSurvey]);

  useEffect(() => {
    if (!publicClient) return;
    let cancelled = false;

    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const latestBlock = await publicClient.getBlockNumber();

        const getEventsForSurvey = async (
          eventName: "SurveyCreated" | "AnswerSubmitted" | "RewardClaimed" | "SurveyClosed"
        ) => {
          const logs: Array<{
            args?: Record<string, unknown>;
            blockNumber?: bigint;
            transactionHash?: `0x${string}`;
          }> = [];

          for (
            let fromBlock = CONTRACT_DEPLOYMENT_BLOCK;
            fromBlock <= latestBlock;
            fromBlock += LOG_RANGE + ONE_BLOCK
          ) {
            const toBlock = fromBlock + LOG_RANGE > latestBlock ? latestBlock : fromBlock + LOG_RANGE;
            const chunk = await publicClient.getContractEvents({
              address: CONTRACT_ADDRESS,
              abi: SURVEY_PLATFORM_ABI,
              eventName,
              args: { surveyId },
              fromBlock,
              toBlock,
            });

            logs.push(...chunk);
          }

          return logs;
        };

        const [created, submitted, claimedEvents, closed] = await Promise.all([
          getEventsForSurvey("SurveyCreated"),
          getEventsForSurvey("AnswerSubmitted"),
          getEventsForSurvey("RewardClaimed"),
          getEventsForSurvey("SurveyClosed"),
        ]);

        if (cancelled) return;

        const allLogs = [...created, ...submitted, ...claimedEvents, ...closed];
        const uniqueBlocks = [...new Set(allLogs.map((log) => log.blockNumber).filter(Boolean))] as bigint[];
        const blocks = await Promise.all(
          uniqueBlocks.map((blockNumber) => publicClient.getBlock({ blockNumber }))
        );
        const blockTimestamps = new Map(blocks.map((block) => [block.number, block.timestamp]));

        if (cancelled) return;

        const items: HistoryItem[] = [
          ...created.map((log) => ({
            type: "created",
            label: "Item Created",
            actorLabel: truncateAddress(String(log.args?.creator ?? "")),
            detail: "Published on-chain",
            txHash: log.transactionHash ?? undefined,
            ts: blockTimestamps.get(log.blockNumber!) ?? BigInt(0),
            actor: String(log.args?.creator ?? "").toLowerCase(),
          })),
          ...submitted.map((log) => ({
            type: "response",
            label: "Response Submitted",
            actorLabel: truncateAddress(String(log.args?.respondent ?? "")),
            detail: `Response #${log.args?.responseIndex?.toString() ?? "?"}`,
            txHash: log.transactionHash ?? undefined,
            ts: blockTimestamps.get(log.blockNumber!) ?? BigInt(0),
            actor: String(log.args?.respondent ?? "").toLowerCase(),
          })),
          ...claimedEvents.map((log) => ({
            type: "claimed",
            label: "Reward Claimed",
            actorLabel: truncateAddress(String(log.args?.respondent ?? "")),
            detail: `${log.args?.amount !== undefined ? formatEther(log.args.amount as bigint) : "?"} ETH distributed`,
            txHash: log.transactionHash ?? undefined,
            ts: blockTimestamps.get(log.blockNumber!) ?? BigInt(0),
            actor: String(log.args?.respondent ?? "").toLowerCase(),
          })),
          ...closed.map((log) => ({
            type: "closed",
            label: "Item Closed",
            actorLabel: truncateAddress(String(log.args?.creator ?? "")),
            detail: "Closed by creator",
            txHash: log.transactionHash ?? undefined,
            ts: blockTimestamps.get(log.blockNumber!) ?? BigInt(0),
            actor: String(log.args?.creator ?? "").toLowerCase(),
          })),
        ].sort((a, b) => (a.ts > b.ts ? -1 : 1));

        setHistory(items);
      } catch (error) {
        console.error("Failed to load item history", error);
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
    return () => {
      cancelled = true;
    };
  }, [surveyId, publicClient, submitSuccess, claimSuccess]);

  if (surveyLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="psephos-card p-8 animate-pulse">
          <div className="h-5 rounded mb-4" style={{ background: "#2A2D3A", width: "40%" }} />
          <div className="h-8 rounded mb-6" style={{ background: "#2A2D3A", width: "70%" }} />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-4 rounded" style={{ background: "#2A2D3A" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (surveyError || !survey) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>ψ</p>
        <h2 style={{ color: "#F5F6FA", fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Item Not Found
        </h2>
        <p className="text-sm mb-6" style={{ color: "#8B8FA3" }}>
          This item may have been removed or the ID is invalid.
        </p>
        <Link href="/" style={{ textDecoration: "none" }}>
          <button className="btn-primary px-5 py-2.5 text-sm font-semibold">
            Back to Questions
          </button>
        </Link>
      </div>
    );
  }

  const s = survey as SurveyStruct;
  const rewardEth = formatEther(s.rewardPerResponse);
  const isExpired = Date.now() > Number(s.deadline) * 1000;
  const isFull = s.responseCount >= s.maxResponses;
  const progress = Math.min((Number(s.responseCount) / Number(s.maxResponses)) * 100, 100);
  const hasValidMetadataCid = isValidIpfsCid(s.ipfsHash);
  const effectiveKind: SurveyKind = metadata?.kind ?? "survey";
  const displayQuestion = metadata?.question?.trim() || s.title;
  const description = metadata?.description?.trim();
  const options = metadata?.options ?? [];
  const submitTxFromHistory = history?.find((item) => item.type === "response" && item.actor === normalizedAddress)?.txHash;
  const claimTxFromHistory = history?.find((item) => item.type === "claimed" && item.actor === normalizedAddress)?.txHash;
  const latestSubmitTxHash = submitHash ?? submitTxFromHistory;
  const latestClaimTxHash = claimHash ?? claimTxFromHistory;
  const isBusy = preparingResponse || submitPending || submitConfirming || claimPending || claimConfirming;
  const isResponded = hasSubmitted || Boolean(responded);
  const isClaimed = hasClaimed || claimed;
  const selectedOption = options.find((option) => option.id === selectedOptionId) ?? options[0];
  const responseSummary = summarizeResponse(responsePayload);
  const responseCidValue = responseCid ?? "";
  const hasValidResponseCid = responseCid ? isValidIpfsCid(responseCid) : false;
  const usesStructuredChoices = metadataStatus === "ready" && effectiveKind !== "survey";
  const usingLegacySurveyFallback = !metadataLoading && metadataStatus !== "ready";
  const formatValue =
    metadataStatus === "ready"
      ? getTypeSummary(effectiveKind)
      : metadataLoading
        ? "Resolving metadata..."
        : "Legacy / metadata unavailable";
  const kindBadgeLabel =
    metadataStatus === "ready"
      ? getKindLabel(effectiveKind)
      : metadataLoading
        ? "Resolving..."
        : "Metadata unavailable";
  const kindBadgeColor =
    metadataStatus === "ready"
      ? "#A8AAFF"
      : metadataLoading
        ? "#8B8FA3"
        : "#F4B942";
  const metadataNotice =
    metadataStatus === "invalid-cid"
      ? "This item stores a legacy value that is not a valid IPFS CID. Structured choices cannot be recovered."
      : metadataStatus === "legacy"
        ? "This item does not expose structured survey metadata. It is being treated as a legacy survey."
        : metadataStatus === "unavailable"
          ? "Structured metadata is temporarily unavailable. Poll and vote choices cannot be resolved right now."
          : null;

  const handleSubmitResponse = async () => {
    setSubmitError(null);

    let payload: ResponsePayloadV1;

    if (effectiveKind === "survey") {
      if (!responseText.trim()) {
        setSubmitError("Please enter your response before submitting.");
        return;
      }

      payload = {
        version: 1,
        surveyId: surveyId.toString(),
        kind: effectiveKind,
        ...(address ? { respondent: address } : {}),
        submittedAt: new Date().toISOString(),
        response: {
          type: "open-text",
          text: responseText.trim(),
        },
      };
    } else {
      if (!selectedOption) {
        setSubmitError("Please choose one option before continuing.");
        return;
      }

      payload = {
        version: 1,
        surveyId: surveyId.toString(),
        kind: effectiveKind,
        ...(address ? { respondent: address } : {}),
        submittedAt: new Date().toISOString(),
        response: {
          type: "single-choice",
          optionId: selectedOption.id,
          optionLabel: selectedOption.label,
        },
      };
    }

    setPreparingResponse(true);
    try {
      const uploadedResponse = await uploadJsonPayload("/api/ipfs/response", payload);
      const hash = await submitContractAsync({
        address: CONTRACT_ADDRESS,
        abi: SURVEY_PLATFORM_ABI,
        functionName: "submitResponse",
        chainId: baseSepolia.id,
        args: [surveyId, uploadedResponse.cid],
      });

      setLocalResponseCid(uploadedResponse.cid);
      setResponsePayload(payload);
      setSubmitHash(hash);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("IPFS") || message.includes("response")) {
        setSubmitError(message);
      } else {
        setSubmitError(parseContractError(error as Error));
      }
    } finally {
      setPreparingResponse(false);
    }
  };

  const handleClaimReward = async () => {
    try {
      const hash = await claimContractAsync({
        address: CONTRACT_ADDRESS,
        abi: SURVEY_PLATFORM_ABI,
        functionName: "claimReward",
        chainId: baseSepolia.id,
        args: [surveyId],
      });
      setClaimHash(hash);
    } catch {
      // useWriteContract already exposes error state for the UI
    }
  };

  const step = !isConnected ? 1 : !isResponded ? 2 : !isClaimed ? 3 : 4;

  const statusOf = (value: number): "done" | "active" | "locked" => {
    if (step > value) return "done";
    if (step === value) return "active";
    return "locked";
  };

  const Pill = (label: string, green = false) => (
    <span
      className="text-xs px-2 py-0.5 rounded-full"
      style={{
        background: green ? "rgba(59,109,17,0.15)" : "rgba(0,229,204,0.1)",
        color: green ? "#6DBF2F" : "#00E5CC",
        border: `1px solid ${green ? "rgba(59,109,17,0.3)" : "rgba(0,229,204,0.2)"}`,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );

  const Node = (value: number, status: "done" | "active" | "locked") => (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          status === "done" ? "#00E5CC" : status === "active" ? "rgba(0,229,204,0.12)" : "#0F1117",
        border: `2px solid ${status === "locked" ? "#2A2D3A" : "#00E5CC"}`,
        color: status === "done" ? "#0F1117" : status === "active" ? "#00E5CC" : "#3A3D4E",
        fontSize: "0.7rem",
        fontWeight: 700,
        boxShadow: status === "active" ? "0 0 14px rgba(0,229,204,0.4)" : "none",
        transition: "all 0.35s ease",
      }}
    >
      {status === "done" ? <Check size={13} /> : value}
    </div>
  );

  const Line = (filled: boolean) => (
    <div
      style={{
        width: 2,
        flex: 1,
        minHeight: 20,
        background: filled ? "#00E5CC" : "#2A2D3A",
        opacity: 0.5,
        transition: "background 0.5s ease",
        margin: "3px 0",
      }}
    />
  );

  const ActionLink = ({ hash, label }: { hash?: `0x${string}`; label: string }) =>
    hash ? (
      <a
        href={`https://sepolia.basescan.org/tx/${hash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium hover:opacity-80 transition-opacity"
        style={{ color: "#00E5CC" }}
      >
        <ExternalLink size={12} />
        {label}
      </a>
    ) : null;

  return (
    <div className="max-w-6xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm mb-6 hover:opacity-75 transition-opacity"
        style={{ color: "#8B8FA3", textDecoration: "none" }}
      >
        <ArrowLeft size={15} />
        All Questions
      </Link>

      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <StatusBadge active={s.active} deadline={s.deadline} />
          <span
            className="inline-flex items-center gap-1.5 self-start text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              background:
                metadataStatus === "ready"
                  ? "rgba(123,126,255,0.08)"
                  : metadataLoading
                    ? "rgba(139,143,163,0.08)"
                    : "rgba(244,185,66,0.08)",
              border:
                metadataStatus === "ready"
                  ? "1px solid rgba(123,126,255,0.18)"
                  : metadataLoading
                    ? "1px solid rgba(139,143,163,0.2)"
                    : "1px solid rgba(244,185,66,0.18)",
              color: kindBadgeColor,
            }}
          >
            <CircleDot size={12} />
            {kindBadgeLabel}
          </span>
          {metadataLoading && (
            <span className="text-xs" style={{ color: "#8B8FA3" }}>
              Resolving metadata...
            </span>
          )}
        </div>

        <div>
          <h1 style={{ color: "#F5F6FA", fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.3 }}>
            {displayQuestion}
          </h1>
          {description && (
            <p className="mt-3 max-w-3xl text-sm leading-relaxed" style={{ color: "#8B8FA3" }}>
              {description}
            </p>
          )}
          {metadataNotice && (
            <div
              className="mt-4 max-w-3xl rounded-xl p-3 flex items-start gap-2.5"
              style={{
                background: "rgba(244,185,66,0.08)",
                border: "1px solid rgba(244,185,66,0.18)",
              }}
            >
              <AlertCircle size={14} style={{ color: "#F4B942", flexShrink: 0, marginTop: 2 }} />
              <p className="text-sm leading-relaxed" style={{ color: "#F5F6FA" }}>
                {metadataNotice}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.95fr)] gap-6 xl:gap-8 items-start">
        <div className="min-w-0">
          <div className="psephos-card p-0 overflow-hidden">
            <div
              style={{
                height: "3px",
                background: s.active && !isExpired
                  ? "linear-gradient(90deg, #00E5CC, rgba(0,229,204,0.2))"
                  : "#2A2D3A",
              }}
            />
            <MeanderBorder color="rgba(0,229,204,0.1)" height={10} />

            <div className="px-5 pt-3 pb-5">
              <h2
                className="mb-3"
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "#8B8FA3",
                }}
              >
                Item Details
              </h2>

              <DetailRow
                icon={<FileText size={14} />}
                label="Format"
                value={formatValue}
              />
              <DetailRow
                icon={<Wallet size={14} />}
                label="Creator"
                value={truncateAddress(s.creator)}
                mono
                copyable
              />
              <DetailRow
                icon={<Coins size={14} />}
                label="Reward / Response"
                value={`${rewardEth} ETH`}
                valueStyle={{ color: "#00E5CC" }}
              />
              <DetailRow
                icon={<Calendar size={14} />}
                label="Deadline"
                value={formatDate(s.deadline)}
              />
              <DetailRow
                icon={<Coins size={14} />}
                label="Contract Balance"
                value={`${formatEther(s.balance)} ETH`}
              />

              {options.length > 0 && (
                <div className="py-3" style={{ borderBottom: "1px solid #2A2D3A" }}>
                  <div className="flex items-center gap-2.5 mb-2">
                    <Users size={14} style={{ color: "#8B8FA3" }} />
                    <span className="text-sm" style={{ color: "#8B8FA3" }}>
                      Choices
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {options.map((option) => (
                      <span
                        key={option.id}
                        className="px-2.5 py-1 rounded-full text-xs"
                        style={{
                          background: "rgba(0,229,204,0.08)",
                          border: "1px solid rgba(0,229,204,0.18)",
                          color: "#00E5CC",
                        }}
                      >
                        {option.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="py-3" style={{ borderBottom: "1px solid #2A2D3A" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <Users size={14} style={{ color: "#8B8FA3" }} />
                    <span className="text-sm" style={{ color: "#8B8FA3" }}>
                      Responses
                    </span>
                  </div>
                  <span className="text-sm font-medium" style={{ color: "#F5F6FA" }}>
                    {s.responseCount.toString()}/{s.maxResponses.toString()}
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

              <div className="pt-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={15} style={{ color: "#00E5CC", marginTop: 2 }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#F5F6FA" }}>
                      Proof / Technical details
                    </p>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: "#8B8FA3" }}>
                      This item is stored on IPFS and referenced on-chain.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl p-4" style={{ background: "#0F1117", border: "1px solid #2A2D3A" }}>
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: "#8B8FA3" }}>
                        Metadata CID
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span style={{ color: "#F5F6FA", fontFamily: "monospace", fontSize: "0.75rem" }}>
                          {s.ipfsHash}
                        </span>
                        {hasValidMetadataCid ? (
                          <a
                            href={buildIpfsUrl(s.ipfsHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium hover:opacity-80 transition-opacity"
                            style={{ color: "#00E5CC" }}
                          >
                            <ExternalLink size={12} />
                            Open metadata
                          </a>
                        ) : (
                          <span className="text-xs font-medium" style={{ color: "#F4B942" }}>
                            Invalid legacy CID
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: "#8B8FA3" }}>
                        Your response CID
                      </p>
                      {responseCid ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span style={{ color: "#F5F6FA", fontFamily: "monospace", fontSize: "0.75rem" }}>
                            {responseCidValue}
                          </span>
                          {hasValidResponseCid ? (
                            <a
                              href={buildIpfsUrl(responseCidValue)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-medium hover:opacity-80 transition-opacity"
                              style={{ color: "#00E5CC" }}
                            >
                              <ExternalLink size={12} />
                              Open response
                            </a>
                          ) : (
                            <span className="text-xs font-medium" style={{ color: "#F4B942" }}>
                              Invalid stored value
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs" style={{ color: "#4A4D5E" }}>
                          Available after you submit.
                        </p>
                      )}
                    </div>

                    {(responsePayloadLoading || responseSummary) && (
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: "#8B8FA3" }}>
                          Response preview
                        </p>
                        <p className="text-xs leading-relaxed" style={{ color: "#F5F6FA" }}>
                          {responsePayloadLoading ? "Loading response preview..." : responseSummary}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="psephos-card p-5 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2
                style={{
                  color: "#8B8FA3",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {getParticipationHeading(effectiveKind)}
              </h2>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: "rgba(0,229,204,0.08)",
                  border: "1px solid rgba(0,229,204,0.2)",
                  color: "#00E5CC",
                }}
              >
                {rewardEth} ETH
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex gap-3">
                <div className="flex flex-col items-center" style={{ width: 32 }}>
                  {Node(1, statusOf(1))}
                  {Line(step > 1)}
                </div>
                <div className="flex-1 pb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold" style={{ color: statusOf(1) !== "locked" ? "#F5F6FA" : "#3A3D4E" }}>
                      Connect Wallet
                    </span>
                    {statusOf(1) === "done" && Pill("Connected ✓")}
                  </div>
                  {statusOf(1) === "active" && (
                    <div className="flex flex-col gap-3">
                      <p className="text-xs leading-relaxed" style={{ color: "#8B8FA3" }}>
                        Connect to earn
                        <span style={{ color: "#00E5CC", fontWeight: 600 }}> {rewardEth} ETH </span>
                        for your participation.
                      </p>
                      <ConnectButton />
                    </div>
                  )}
                  {statusOf(1) === "done" && address && (
                    <p className="text-xs" style={{ color: "#8B8FA3", fontFamily: "monospace" }}>
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </p>
                  )}
                  {statusOf(1) === "locked" && (
                    <p className="text-xs" style={{ color: "#3A3D4E" }}>-</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center" style={{ width: 32 }}>
                  {Node(2, statusOf(2))}
                  {Line(step > 2)}
                </div>
                <div className="flex-1 pb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold" style={{ color: statusOf(2) !== "locked" ? "#F5F6FA" : "#3A3D4E" }}>
                      {getRespondAction(effectiveKind)}
                    </span>
                    {statusOf(2) === "done" && Pill("Submitted ✓")}
                  </div>

                  {statusOf(2) === "active" && (!s.active || isExpired || isFull) && (
                    <div
                      className="flex items-start gap-2 p-3 rounded-lg"
                      style={{ background: "rgba(139,143,163,0.06)", border: "1px solid #2A2D3A" }}
                    >
                      <AlertCircle size={13} style={{ color: "#8B8FA3", flexShrink: 0, marginTop: 1 }} />
                      <p className="text-xs" style={{ color: "#8B8FA3" }}>
                        {!s.active ? "This item is closed." : isExpired ? "This item has expired." : "No slots remaining."}
                      </p>
                    </div>
                  )}

                  {statusOf(2) === "active" && s.active && !isExpired && !isFull && isBusy && (preparingResponse || submitPending || submitConfirming) && (
                    <div className="flex flex-col items-center gap-3 py-4 text-center">
                      <span
                        className="block w-8 h-8 rounded-full border-2 animate-spin"
                        style={{ borderColor: "#00E5CC", borderTopColor: "transparent" }}
                      />
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "#F5F6FA" }}>
                          {preparingResponse ? "Preparing response..." : submitPending ? "Check your wallet" : "Submitting on-chain..."}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "#8B8FA3" }}>
                          {preparingResponse ? "Uploading structured data to IPFS" : submitPending ? "Approve in MetaMask" : "Usually 5-15 seconds"}
                        </p>
                      </div>
                      {submitConfirming && submitHash && <TxHashDisplay hash={submitHash} />}
                    </div>
                  )}

                  {statusOf(2) === "active" && s.active && !isExpired && !isFull && !preparingResponse && !submitPending && !submitConfirming && (
                    <div className="flex flex-col gap-3">
                      <div
                        className="flex items-center justify-between px-2.5 py-2 rounded-lg"
                        style={{ background: "rgba(0,229,204,0.05)", border: "1px solid rgba(0,229,204,0.1)" }}
                      >
                        <span className="text-xs" style={{ color: "#8B8FA3" }}>Reward</span>
                        <span className="font-bold" style={{ color: "#00E5CC", textShadow: "0 0 8px rgba(0,229,204,0.3)" }}>
                          {rewardEth} ETH
                        </span>
                      </div>

                      {metadataLoading ? (
                        <div
                          className="flex items-start gap-2 p-3 rounded-lg"
                          style={{ background: "rgba(139,143,163,0.06)", border: "1px solid #2A2D3A" }}
                        >
                          <Activity size={13} style={{ color: "#8B8FA3", flexShrink: 0, marginTop: 1 }} />
                          <p className="text-xs" style={{ color: "#8B8FA3" }}>
                            Loading structured metadata to determine the response format...
                          </p>
                        </div>
                      ) : !usesStructuredChoices ? (
                        <div>
                          {usingLegacySurveyFallback && metadataNotice && (
                            <div
                              className="flex items-start gap-2 p-3 rounded-lg mb-3"
                              style={{
                                background: "rgba(244,185,66,0.08)",
                                border: "1px solid rgba(244,185,66,0.18)",
                              }}
                            >
                              <AlertCircle size={13} style={{ color: "#F4B942", flexShrink: 0, marginTop: 1 }} />
                              <p className="text-xs leading-relaxed" style={{ color: "#F5F6FA" }}>
                                {metadataNotice}
                              </p>
                            </div>
                          )}
                          <textarea
                            id="responseText"
                            value={responseText}
                            onChange={(event) => {
                              setResponseText(event.target.value);
                              if (submitError) setSubmitError(null);
                            }}
                            placeholder="Write your response here. Psephos will package it into IPFS metadata for you."
                            className="psephos-input w-full px-3 py-3 text-sm min-h-[132px] resize-y"
                          />
                          {(submitError || submitWriteError) ? (
                            <p className="flex items-center gap-1 text-xs mt-1.5" style={{ color: "#E54D4D" }}>
                              <AlertCircle size={10} />
                              {submitError ?? parseContractError(submitWriteError)}
                            </p>
                          ) : (
                            <p className="text-xs mt-1.5" style={{ color: "#8B8FA3" }}>
                              Your response will be uploaded to IPFS automatically before the transaction is sent.
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {options.map((option) => {
                            const selected = (selectedOptionId || options[0]?.id) === option.id;

                            return (
                              <label
                                key={option.id}
                                className="flex items-center gap-3 rounded-xl px-3 py-3 cursor-pointer transition-colors"
                                style={{
                                  background: selected ? "rgba(0,229,204,0.08)" : "#0F1117",
                                  border: `1px solid ${selected ? "rgba(0,229,204,0.24)" : "#2A2D3A"}`,
                                  color: selected ? "#F5F6FA" : "#8B8FA3",
                                }}
                              >
                                <input
                                  type="radio"
                                  name="single-choice-response"
                                  checked={selected}
                                  onChange={() => {
                                    setSelectedOptionId(option.id);
                                    if (submitError) setSubmitError(null);
                                  }}
                                  className="sr-only"
                                />
                                <span
                                  className="w-4 h-4 rounded-full flex items-center justify-center"
                                  style={{
                                    border: `1px solid ${selected ? "#00E5CC" : "#4A4D5E"}`,
                                    background: selected ? "rgba(0,229,204,0.12)" : "transparent",
                                  }}
                                >
                                  {selected && (
                                    <span
                                      className="block w-2 h-2 rounded-full"
                                      style={{ background: "#00E5CC" }}
                                    />
                                  )}
                                </span>
                                <span className="text-sm font-medium">{option.label}</span>
                              </label>
                            );
                          })}

                          {(submitError || submitWriteError) ? (
                            <p className="flex items-center gap-1 text-xs mt-1.5" style={{ color: "#E54D4D" }}>
                              <AlertCircle size={10} />
                              {submitError ?? parseContractError(submitWriteError)}
                            </p>
                          ) : (
                            <p className="text-xs mt-1.5" style={{ color: "#8B8FA3" }}>
                              Your choice will be wrapped as JSON and uploaded to IPFS automatically.
                            </p>
                          )}
                        </div>
                      )}

                      <button
                        onClick={handleSubmitResponse}
                        disabled={metadataLoading || preparingResponse || submitPending || submitConfirming}
                        className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold"
                      >
                        <Send size={13} />
                        {metadataLoading ? "Loading format..." : getRespondAction(effectiveKind)}
                      </button>
                    </div>
                  )}

                  {statusOf(2) === "done" && (
                    <div>
                      <p className="text-xs" style={{ color: "#8B8FA3" }}>
                        {responseSummary
                          ? `Recorded: ${responseSummary}`
                          : "Your response is recorded on-chain."}
                      </p>
                      {submitHash && <TxHashDisplay hash={submitHash} />}
                      {!submitHash && <ActionLink hash={latestSubmitTxHash} label="View submit transaction" />}
                    </div>
                  )}

                  {statusOf(2) === "locked" && (
                    <p className="text-xs" style={{ color: "#3A3D4E" }}>Connect your wallet to proceed.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center" style={{ width: 32 }}>
                  {Node(3, statusOf(3))}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold" style={{ color: statusOf(3) !== "locked" ? "#F5F6FA" : "#3A3D4E" }}>
                      Claim Reward
                    </span>
                    {statusOf(3) === "done" && Pill("Claimed ✓")}
                  </div>

                  {statusOf(3) === "active" && (claimPending || claimConfirming) && (
                    <div className="flex flex-col items-center gap-3 py-4 text-center">
                      <span
                        className="block w-8 h-8 rounded-full border-2 animate-spin"
                        style={{ borderColor: "#00E5CC", borderTopColor: "transparent" }}
                      />
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "#F5F6FA" }}>
                          {claimPending ? "Check your wallet" : "Sending reward..."}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "#8B8FA3" }}>
                          {claimPending ? "Approve in MetaMask" : "Usually 5-15 seconds"}
                        </p>
                      </div>
                      {claimConfirming && claimHash && <TxHashDisplay hash={claimHash} />}
                    </div>
                  )}

                  {statusOf(3) === "active" && !claimPending && !claimConfirming && (
                    <div className="flex flex-col gap-3">
                      <div
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                        style={{ background: "rgba(0,229,204,0.06)", border: "1px solid rgba(0,229,204,0.2)" }}
                      >
                        <div>
                          <p className="text-xs" style={{ color: "#8B8FA3" }}>Claimable</p>
                          <p className="text-xs mt-0.5" style={{ color: "#4A4D5E" }}>Ready to withdraw</p>
                        </div>
                        <span style={{ color: "#00E5CC", fontWeight: 700, fontSize: "1.1rem", textShadow: "0 0 10px rgba(0,229,204,0.3)" }}>
                          {rewardEth}
                          <span style={{ fontSize: "0.7rem", fontWeight: 500, marginLeft: 3 }}>ETH</span>
                        </span>
                      </div>
                      {claimWriteError && (
                        <p className="flex items-center gap-1 text-xs" style={{ color: "#E54D4D" }}>
                          <AlertCircle size={10} />
                          {parseContractError(claimWriteError)}
                        </p>
                      )}
                      <button
                        onClick={handleClaimReward}
                        disabled={claimPending || claimConfirming}
                        className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold"
                      >
                        <Gift size={14} />
                        Claim {rewardEth} ETH
                      </button>
                    </div>
                  )}

                  {statusOf(3) === "done" && (
                    <div className="flex flex-col gap-3">
                      <div
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                        style={{
                          background: "rgba(0,229,204,0.07)",
                          border: "1px solid rgba(0,229,204,0.25)",
                          boxShadow: "0 0 16px rgba(0,229,204,0.08)",
                        }}
                      >
                        <div>
                          <p className="text-xs" style={{ color: "#8B8FA3" }}>Received</p>
                          <p className="text-xs mt-0.5" style={{ color: "#4A4D5E" }}>Sent to your wallet</p>
                        </div>
                        <span style={{ color: "#00E5CC", fontWeight: 700, fontSize: "1.1rem", textShadow: "0 0 10px rgba(0,229,204,0.3)" }}>
                          {rewardEth}
                          <span style={{ fontSize: "0.7rem", fontWeight: 500, marginLeft: 3 }}>ETH</span>
                        </span>
                      </div>
                      {claimHash && <TxHashDisplay hash={claimHash} />}
                      {!claimHash && <ActionLink hash={latestClaimTxHash} label="View claim transaction" />}
                    </div>
                  )}

                  {statusOf(3) === "locked" && (
                    <p className="text-xs" style={{ color: "#3A3D4E" }}>Submit your response to unlock.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full mt-12 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={17} style={{ color: "#00E5CC" }} />
          <span style={{ color: "#F5F6FA", fontWeight: 700, fontSize: "1.1rem" }}>On-Chain History</span>
        </div>
        {historyLoading ? (
          <div className="psephos-card p-6 animate-pulse text-sm text-[#8B8FA3]">Loading history...</div>
        ) : history && history.length > 0 ? (
          <div className="psephos-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <div
                className="grid min-w-[860px] grid-cols-[1.2fr_1fr_1.15fr_1fr_0.85fr_56px] gap-3 px-5 py-3 text-[11px] uppercase tracking-[0.12em] border-b border-[#2A2D3A]"
                style={{ color: "#4A4D5E", background: "rgba(15,17,23,0.85)" }}
              >
                <span>Action</span>
                <span>Actor</span>
                <span>Details</span>
                <span>Date</span>
                <span>Age</span>
                <span className="text-right">Tx</span>
              </div>
              {history.map((item, index) => (
                <div
                  key={index}
                  className="grid min-w-[860px] grid-cols-[1.2fr_1fr_1.15fr_1fr_0.85fr_56px] gap-3 px-5 py-4 border-b border-[#2A2D3A] last:border-b-0"
                  style={{ background: index % 2 === 0 ? "rgba(26,29,39,0.92)" : "rgba(15,17,23,0.92)" }}
                >
                  <div className="flex flex-col gap-1">
                    <span
                      style={{
                        fontSize: 13,
                        color:
                          item.type === "created"
                            ? "#00E5CC"
                            : item.type === "closed"
                              ? "#E54D4D"
                              : item.type === "claimed"
                                ? "#7B7EFF"
                                : "#8B8FA3",
                        fontWeight: 700,
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {item.actor ? (
                      <a
                        href={`https://sepolia.basescan.org/address/${item.actor}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs hover:opacity-80 transition-opacity"
                        style={{ color: "#F5F6FA", fontFamily: "monospace" }}
                      >
                        {item.actorLabel}
                        <ExternalLink size={11} style={{ color: "#00E5CC" }} />
                      </a>
                    ) : (
                      <span className="text-xs" style={{ color: "#F5F6FA", fontFamily: "monospace" }}>
                        {item.actorLabel}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs leading-relaxed" style={{ color: "#8B8FA3" }}>
                      {item.detail}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs" style={{ color: "#8B8FA3" }}>
                      {formatHistoryDate(item.ts)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs" style={{ color: "#8B8FA3" }}>
                      {formatHistoryAge(item.ts)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 sm:items-end">
                    {item.txHash ? (
                      <a
                        href={`https://sepolia.basescan.org/tx/${item.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:opacity-80 transition-opacity"
                        style={{
                          color: "#00E5CC",
                          background: "rgba(0,229,204,0.08)",
                          border: "1px solid rgba(0,229,204,0.18)",
                        }}
                        aria-label={`Open transaction for ${item.label}`}
                      >
                        <ExternalLink size={13} />
                      </a>
                    ) : (
                      <span className="text-xs" style={{ color: "#4A4D5E" }}>
                        --
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="psephos-card p-6 text-sm text-[#8B8FA3]">No on-chain activity yet for this item.</div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          sub={toast.sub}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
