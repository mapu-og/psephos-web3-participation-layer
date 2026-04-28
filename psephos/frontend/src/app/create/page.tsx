"use client";

import { useEffect, useMemo, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount, usePublicClient } from "wagmi";
import { decodeEventLog, parseEther, formatEther } from "viem";
import { baseSepolia } from "wagmi/chains";
import { CONTRACT_ADDRESS, SURVEY_PLATFORM_ABI } from "@/config/contract";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import {
  FileText,
  Coins,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  ArrowRight,
  Plus,
  Trash2,
  ListChecks,
  LayoutList,
  Vote,
} from "lucide-react";
import { InputField } from "@/components/InputField";
import { StepperInput } from "@/components/StepperInput";
import { DateTimePicker } from "@/components/DateTimePicker";
import {
  getKindLabel,
  SurveyKind,
  SurveyMetadataV1,
  createOptionId,
  getCreateDescription,
  getCreateTitle,
  getKindQuestionLabel,
  normalizeSurveyOptions,
} from "@/lib/psephos";

type IpfsUploadResponse = {
  cid: string;
  url: string;
};

function parseContractError(error: unknown): string {
  if (!error) return "";

  let raw = "";
  try {
    raw = JSON.stringify(error, (_, value) => (typeof value === "bigint" ? value.toString() : value)) + " ";
  } catch {
    // ignore
  }
  raw +=
    String((error as { message?: string }).message ?? "") +
    " " +
    String((error as { cause?: unknown }).cause ?? "");

  if (raw.includes("IncorrectDeposit")) return "Deposit mismatch — reward × max responses must equal the ETH sent.";
  if (raw.includes("InsufficientDeposit")) return "Deposit amount is insufficient.";
  if (raw.includes("DeadlineInPast") || raw.includes("InvalidDeadline")) return "Deadline must be in the future.";
  if (raw.includes("EmptyTitle")) return "Question cannot be empty.";
  if (raw.includes("EmptyIpfsHash") || raw.includes("InvalidIpfsHash")) return "Unable to attach metadata for this question.";
  if (raw.includes("RewardMustBePositive")) return "Reward per response must be greater than 0.";
  if (raw.includes("MaxResponsesMustBePositive")) return "Max responses must be at least 1.";
  if (/user rejected|User rejected|denied/i.test(raw)) return "Transaction cancelled.";
  return "Transaction failed. Please try again.";
}

async function uploadJsonPayload(route: string, payload: unknown): Promise<IpfsUploadResponse> {
  const response = await fetch(route, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as Partial<IpfsUploadResponse> & {
    error?: string;
  } | null;

  if (!response.ok || !data?.cid || !data.url) {
    throw new Error(data?.error ?? "Unable to upload payload to IPFS.");
  }

  return {
    cid: data.cid,
    url: data.url,
  };
}

export default function CreatePage() {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const router = useRouter();

  const [kind, setKind] = useState<SurveyKind>("survey");
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [rewardEth, setRewardEth] = useState("");
  const [maxResponses, setMaxResponses] = useState("");
  const [deadlineStr, setDeadlineStr] = useState("");
  const [optionInputs, setOptionInputs] = useState<string[]>(["", ""]);
  const [error, setError] = useState<string | null>(null);
  const [submitStage, setSubmitStage] = useState<"idle" | "preparing" | "wallet">("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [createdSurveyId, setCreatedSurveyId] = useState<string | null>(null);

  const { writeContractAsync } = useWriteContract();

  const { data: receipt, isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (kind === "survey") return;

    setOptionInputs((current) => {
      if (current.length >= 2) return current;
      if (kind === "vote" && current.every((value) => value.trim().length === 0)) {
        return ["Yes", "No"];
      }
      return [...current, ...Array.from({ length: 2 - current.length }, () => "")];
    });
  }, [kind]);

  useEffect(() => {
    if (!receipt || createdSurveyId) return;

    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) continue;

      try {
        const decoded = decodeEventLog({
          abi: SURVEY_PLATFORM_ABI,
          data: log.data,
          topics: log.topics,
        });

        if (decoded.eventName === "SurveyCreated") {
          setCreatedSurveyId(String(decoded.args.surveyId));
          break;
        }
      } catch {
        // Ignore unrelated or undecodable logs.
      }
    }
  }, [receipt, createdSurveyId]);

  useEffect(() => {
    if (!isSuccess || createdSurveyId || !publicClient) return;

    let cancelled = false;

    const resolveCreatedSurveyId = async () => {
      try {
        const count = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: SURVEY_PLATFORM_ABI,
          functionName: "getSurveyCount",
        });

        if (!cancelled && count > BigInt(0)) {
          setCreatedSurveyId(String(count - BigInt(1)));
        }
      } catch {
        // Keep the generic success state if fallback resolution fails.
      }
    };

    resolveCreatedSurveyId();
    return () => {
      cancelled = true;
    };
  }, [isSuccess, createdSurveyId, publicClient]);

  const normalizedOptions = useMemo(
    () => normalizeSurveyOptions(kind, optionInputs),
    [kind, optionInputs]
  );

  const totalEthDisplay = (() => {
    try {
      if (!rewardEth || !maxResponses) return "0";
      const totalWei = parseEther(rewardEth) * BigInt(parseInt(maxResponses, 10));
      return formatEther(totalWei);
    } catch {
      return "0";
    }
  })();

  const minimumDeadline = useMemo(
    () => new Date(Date.now() + 15 * 60 * 1000),
    []
  );

  const hasDuplicateOptionLabels = useMemo(() => {
    const cleaned = optionInputs
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    return new Set(cleaned).size !== cleaned.length;
  }, [optionInputs]);

  const clearForm = () => {
    setKind("survey");
    setQuestion("");
    setDescription("");
    setRewardEth("");
    setMaxResponses("");
    setDeadlineStr("");
    setOptionInputs(["", ""]);
    setError(null);
    setSubmitStage("idle");
    setTxHash(undefined);
    setCreatedSurveyId(null);
  };

  const handleOptionChange = (index: number, value: string) => {
    setOptionInputs((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index ? value : option
      )
    );
  };

  const addOption = () => {
    setOptionInputs((current) => [...current, ""]);
  };

  const removeOption = (index: number) => {
    setOptionInputs((current) => {
      if (current.length <= 2) return current;
      return current.filter((_, optionIndex) => optionIndex !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!question.trim() || !rewardEth || !maxResponses || !deadlineStr) {
      setError("Please complete the required fields before continuing.");
      return;
    }

    if (kind !== "survey") {
      if (hasDuplicateOptionLabels) {
        setError("Options must be unique.");
        return;
      }

      if (normalizedOptions.length < 2) {
        setError(`Add at least two valid options for this ${kind}.`);
        return;
      }
    }

    const deadlineTimestamp = BigInt(
      Math.floor(new Date(deadlineStr).getTime() / 1000)
    );

    if (deadlineTimestamp <= BigInt(Math.floor(Date.now() / 1000))) {
      setError("Deadline must be in the future.");
      return;
    }

    let rewardPerResponse: bigint;
    let maxResponsesBig: bigint;
    try {
      rewardPerResponse = parseEther(rewardEth);
      maxResponsesBig = BigInt(parseInt(maxResponses, 10));
    } catch {
      setError("Invalid numeric values.");
      return;
    }

    const metadata: SurveyMetadataV1 = {
      version: 1,
      kind,
      question: question.trim(),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(kind === "survey" ? {} : { options: normalizedOptions }),
      responseMode: kind === "survey" ? "open-text" : "single-choice",
      allowBlankVote: kind === "vote",
    };

    setSubmitStage("preparing");

    try {
      const uploadedMetadata = await uploadJsonPayload(
        "/api/ipfs/survey-metadata",
        metadata
      );

      setSubmitStage("wallet");
      const deposit = rewardPerResponse * maxResponsesBig;
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: SURVEY_PLATFORM_ABI,
        functionName: "createSurvey",
        chainId: baseSepolia.id,
        args: [question.trim(), uploadedMetadata.cid, rewardPerResponse, maxResponsesBig, deadlineTimestamp],
        value: deposit,
      });

      setTxHash(hash);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("metadata") || message.includes("IPFS")) {
        setError(message);
      } else {
        setError(parseContractError(err));
      }
      setSubmitStage("idle");
    }
  };

  if (isSuccess && txHash) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-16">
        <div
          className="psephos-card p-8 flex flex-col items-center text-center gap-6"
          style={{ border: "1px solid rgba(0,229,204,0.24)", boxShadow: "0 0 28px rgba(0,229,204,0.08)" }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: "radial-gradient(circle at center, rgba(0,229,204,0.18), rgba(0,229,204,0.05))",
              border: "1px solid rgba(0,229,204,0.28)",
              boxShadow: "0 0 24px rgba(0,229,204,0.18)",
            }}
          >
            <CheckCircle size={32} style={{ color: "#00E5CC" }} />
          </div>

          <div>
            <h2
              className="mb-1"
              style={{ color: "#F5F6FA", fontSize: "1.25rem", fontWeight: 700 }}
            >
              {getKindLabel(kind)} Created!
            </h2>
            <p style={{ color: "#8B8FA3", fontSize: "0.875rem" }}>
              Your {kind} is now live on-chain and ready for participation.
            </p>
          </div>

          <div
            className="w-full p-3 rounded-lg flex flex-col gap-1.5"
            style={{ background: "#0F1117", border: "1px solid #2A2D3A" }}
          >
            <p className="text-xs font-medium" style={{ color: "#8B8FA3" }}>
              Transaction Hash
            </p>
            <a
              href={`https://sepolia.basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs hover:opacity-75 transition-opacity"
              style={{ color: "#00E5CC", fontFamily: "monospace", wordBreak: "break-all" }}
            >
              {txHash}
              <ExternalLink size={11} className="flex-shrink-0" />
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {createdSurveyId && (
              <button
                onClick={() => router.push(`/survey/${createdSurveyId}`)}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold"
              >
                Open Item
                <ArrowRight size={15} />
              </button>
            )}
            <button
              onClick={() => router.push("/")}
              className={`${createdSurveyId ? "btn-ghost" : "btn-primary"} flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold`}
            >
              View Questions
              <ArrowRight size={15} />
            </button>
            <button
              onClick={clearForm}
              className="btn-ghost flex-1 py-3 text-sm font-medium"
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  const kindOptions: Array<{
    value: SurveyKind;
    label: string;
    icon: React.ReactNode;
  }> = [
    { value: "survey", label: "Survey", icon: <LayoutList size={14} /> },
    { value: "poll", label: "Poll", icon: <ListChecks size={14} /> },
    { value: "vote", label: "Vote", icon: <Vote size={14} /> },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1
          className="mb-1"
          style={{ color: "#F5F6FA", fontSize: "1.6rem", fontWeight: 700 }}
        >
          {getCreateTitle(kind)}
        </h1>
        <p style={{ color: "#8B8FA3", fontSize: "0.875rem" }}>
          {getCreateDescription(kind)}
        </p>
      </div>

      {!isConnected && (
        <div
          className="flex items-center justify-between gap-4 p-4 rounded-xl mb-6"
          style={{
            background: "rgba(229,77,77,0.07)",
            border: "1px solid rgba(229,77,77,0.25)",
          }}
        >
          <div className="flex items-center gap-3">
            <AlertCircle size={16} style={{ color: "#E54D4D", flexShrink: 0 }} />
            <p className="text-sm" style={{ color: "#F5F6FA" }}>
              Connect your wallet to publish this item on-chain.
            </p>
          </div>
          <div className="flex-shrink-0">
            <ConnectButton />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="psephos-card p-6 flex flex-col gap-6" style={{ borderRadius: "12px" }}>
          <InputField
            label="Type"
            icon={<ListChecks size={14} />}
            hint="Choose the interaction mode before publishing."
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {kindOptions.map((option) => {
                const selected = option.value === kind;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setKind(option.value)}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
                    style={{
                      background: selected ? "rgba(0,229,204,0.12)" : "#0F1117",
                      border: `1px solid ${selected ? "rgba(0,229,204,0.35)" : "#2A2D3A"}`,
                      color: selected ? "#00E5CC" : "#8B8FA3",
                      boxShadow: selected ? "0 0 18px rgba(0,229,204,0.08)" : "none",
                    }}
                  >
                    {option.icon}
                    {option.label}
                  </button>
                );
              })}
            </div>
          </InputField>

          <InputField
            label={getKindQuestionLabel(kind)}
            icon={<FileText size={14} />}
            hint="Keep the main prompt clear and short. Detailed structure is stored automatically in IPFS."
          >
            <input
              className="psephos-input w-full px-4 py-3 text-sm"
              type="text"
              placeholder={
                kind === "vote"
                  ? "e.g. Should the community fund the next milestone?"
                  : "e.g. What is the best way to improve the onboarding flow?"
              }
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={160}
            />
          </InputField>

          {kind === "survey" && (
            <InputField
              label="Description (Optional)"
              icon={<FileText size={14} />}
              hint="Add context or instructions for open-text responses."
            >
              <textarea
                className="psephos-input w-full px-4 py-3 text-sm min-h-[120px] resize-y"
                placeholder="Explain what kind of answer you want participants to submit."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
              />
            </InputField>
          )}

          {kind !== "survey" && (
            <InputField
              label="Options"
              icon={<ListChecks size={14} />}
              hint={
                kind === "vote"
                  ? "Provide at least two options. “Blank Vote” will be appended automatically."
                  : "Provide at least two unique options for a single-choice poll."
              }
            >
              <div className="flex flex-col gap-3">
                {optionInputs.map((option, index) => (
                  <div key={`${kind}-option-${index}`} className="flex gap-2">
                    <input
                      className="psephos-input flex-1 px-4 py-3 text-sm"
                      type="text"
                      placeholder={
                        kind === "vote"
                          ? index === 0
                            ? "Yes"
                            : index === 1
                              ? "No"
                              : `Option ${index + 1}`
                          : `Option ${index + 1}`
                      }
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      maxLength={80}
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      disabled={optionInputs.length <= 2}
                      className="btn-ghost px-3 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label={`Remove option ${index + 1}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={addOption}
                    className="btn-ghost inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium self-start"
                  >
                    <Plus size={14} />
                    Add Option
                  </button>

                  {normalizedOptions.length > 0 && (
                    <div
                      className="rounded-xl px-4 py-3"
                      style={{
                        background: "rgba(0,229,204,0.05)",
                        border: "1px solid rgba(0,229,204,0.16)",
                      }}
                    >
                      <p className="text-xs font-semibold mb-2" style={{ color: "#F5F6FA" }}>
                        Final choices stored in metadata
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {normalizedOptions.map((option) => (
                          <span
                            key={option.id}
                            className="px-2.5 py-1 rounded-full text-xs"
                            style={{
                              background: "rgba(0,229,204,0.08)",
                              border: "1px solid rgba(0,229,204,0.2)",
                              color: "#00E5CC",
                            }}
                          >
                            {option.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </InputField>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InputField
              label="Reward per Response"
              icon={<Coins size={14} />}
              hint="ETH paid to each valid participant."
            >
              <StepperInput
                value={rewardEth}
                onChange={setRewardEth}
                placeholder="0.005"
                step={0.0001}
                min={0.0001}
                mode="decimal"
                suffix="ETH"
              />
            </InputField>

            <InputField
              label="Max Responses"
              icon={<Users size={14} />}
              hint="Maximum number of paid participants."
            >
              <StepperInput
                value={maxResponses}
                onChange={setMaxResponses}
                placeholder="100"
                step={1}
                min={1}
                max={10000}
                mode="integer"
              />
            </InputField>
          </div>

          <InputField
            label="Deadline"
            icon={<Calendar size={14} />}
            hint="Responses after this date will not be accepted."
          >
            <DateTimePicker value={deadlineStr} onChange={setDeadlineStr} min={minimumDeadline} />
          </InputField>

          {totalEthDisplay !== "0" && (
            <div
              className="flex items-center justify-between p-4 rounded-xl"
              style={{
                background: "rgba(0,229,204,0.06)",
                border: "1px solid rgba(0,229,204,0.2)",
              }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: "#F5F6FA" }}>
                  Total Deposit Required
                </p>
                <p className="text-xs" style={{ color: "#8B8FA3" }}>
                  {rewardEth} ETH × {maxResponses} participants
                </p>
              </div>
              <div className="text-right">
                <p
                  className="font-bold"
                  style={{
                    color: "#00E5CC",
                    fontSize: "1.4rem",
                    textShadow: "0 0 10px rgba(0,229,204,0.35)",
                  }}
                >
                  {totalEthDisplay}
                </p>
                <p className="text-xs" style={{ color: "#00E5CC", opacity: 0.7 }}>
                  ETH
                </p>
              </div>
            </div>
          )}

          <div
            className="rounded-xl px-4 py-3"
            style={{
              background: "rgba(123,126,255,0.06)",
              border: "1px solid rgba(123,126,255,0.18)",
            }}
          >
            <p className="text-sm font-medium" style={{ color: "#F5F6FA" }}>
              Technical note
            </p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: "#8B8FA3" }}>
              Psephos will package this item as JSON, upload it to IPFS automatically, and only store the CID on-chain.
            </p>
          </div>

          {error && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg"
              style={{ background: "rgba(229,77,77,0.07)", border: "1px solid rgba(229,77,77,0.25)" }}
            >
              <AlertCircle size={14} style={{ color: "#E54D4D", flexShrink: 0 }} />
              <p className="text-sm" style={{ color: "#E54D4D" }}>
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold mt-2"
            disabled={!isConnected || submitStage !== "idle" || isConfirming}
          >
            {submitStage === "preparing" ? (
              <>
                <span
                  className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                  style={{ opacity: 0.8 }}
                />
                Preparing metadata…
              </>
            ) : submitStage === "wallet" ? (
              <>
                <span
                  className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                  style={{ opacity: 0.8 }}
                />
                Confirm in wallet…
              </>
            ) : isConfirming ? (
              <>
                <span
                  className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                  style={{ opacity: 0.8 }}
                />
                Confirming…
              </>
            ) : (
              <>
                <span style={{ fontSize: "1rem" }}>ψ</span>
                Publish {getKindLabel(kind)}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
