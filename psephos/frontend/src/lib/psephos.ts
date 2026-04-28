export type SurveyKind = "survey" | "poll" | "vote";

export type SurveyOption = {
  id: string;
  label: string;
};

export type SurveyMetadataV1 = {
  version: 1;
  kind: SurveyKind;
  question: string;
  description?: string;
  options?: SurveyOption[];
  responseMode: "open-text" | "single-choice";
  allowBlankVote: boolean;
};

export type ResponsePayloadV1 = {
  version: 1;
  surveyId: string;
  kind: SurveyKind;
  respondent?: string;
  submittedAt: string;
  response:
    | { type: "open-text"; text: string }
    | { type: "single-choice"; optionId: string; optionLabel: string };
};

export const BLANK_VOTE_OPTION: SurveyOption = {
  id: "blank-vote",
  label: "Blank Vote",
};

const DEFAULT_GATEWAY_BASE_URL = "https://gateway.pinata.cloud/ipfs";
const CID_V0_PATTERN = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
const CID_V1_PATTERN = /^b[a-z2-7]{20,}$/;

export function isSurveyKind(value: string): value is SurveyKind {
  return value === "survey" || value === "poll" || value === "vote";
}

export function getKindLabel(kind: SurveyKind): string {
  if (kind === "poll") return "Poll";
  if (kind === "vote") return "Vote";
  return "Survey";
}

export function getKindQuestionLabel(kind: SurveyKind): string {
  return kind === "vote" ? "Proposal / Question" : "Question";
}

export function getCreateTitle(kind: SurveyKind): string {
  return `Create ${getKindLabel(kind)}`;
}

export function getCreateDescription(kind: SurveyKind): string {
  if (kind === "poll") {
    return "Publish a single-choice poll with ETH rewards for valid participation.";
  }
  if (kind === "vote") {
    return "Launch an on-chain vote with predefined options and reward participants.";
  }
  return "Publish an open-response question with ETH rewards for valid participation.";
}

export function getRespondAction(kind: SurveyKind): string {
  return kind === "vote" ? "Cast Vote" : "Submit Response";
}

export function getParticipationHeading(kind: SurveyKind): string {
  return kind === "vote" ? "Vote" : "Participate";
}

export function getTypeSummary(kind: SurveyKind): string {
  if (kind === "poll") return "Single-choice poll";
  if (kind === "vote") return "Single-choice vote";
  return "Open response";
}

export function createOptionId(label: string, index: number): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `option-${index + 1}`;
}

export function normalizeSurveyOptions(kind: SurveyKind, rawOptions: string[]): SurveyOption[] {
  const deduped: SurveyOption[] = [];
  const seen = new Set<string>();

  rawOptions.forEach((label, index) => {
    const trimmed = label.trim();
    if (!trimmed) return;

    const normalizedKey = trimmed.toLowerCase();
    if (seen.has(normalizedKey)) return;

    seen.add(normalizedKey);
    deduped.push({
      id: createOptionId(trimmed, index),
      label: trimmed,
    });
  });

  if (kind === "vote") {
    const hasBlank = deduped.some((option) => option.label.toLowerCase() === "blank vote");
    if (!hasBlank) deduped.push(BLANK_VOTE_OPTION);
  }

  return deduped;
}

export function getGatewayBaseUrl(): string {
  const envValue = process.env.IPFS_GATEWAY_BASE_URL?.trim();
  if (!envValue) return DEFAULT_GATEWAY_BASE_URL;
  return envValue.replace(/\/+$/, "");
}

export function isValidIpfsCid(value: string): boolean {
  const cid = value.trim();
  return CID_V0_PATTERN.test(cid) || CID_V1_PATTERN.test(cid);
}

export function buildIpfsUrl(cid: string): string {
  return `${getGatewayBaseUrl()}/${cid}`;
}

export function buildIpfsJsonApiUrl(cid: string): string {
  return `/api/ipfs/json?cid=${encodeURIComponent(cid)}`;
}

export async function fetchIpfsJson<T>(cid: string): Promise<T> {
  if (!isValidIpfsCid(cid)) {
    throw new Error(`Invalid IPFS CID: ${cid}`);
  }

  const response = await fetch(buildIpfsJsonApiUrl(cid), { cache: "no-store" });
  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errorPayload?.error ?? `Failed to load IPFS JSON for ${cid}`);
  }
  return response.json() as Promise<T>;
}

export function isSurveyMetadataV1(value: unknown): value is SurveyMetadataV1 {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<SurveyMetadataV1>;
  if (candidate.version !== 1) return false;
  if (!candidate.kind || !isSurveyKind(candidate.kind)) return false;
  if (typeof candidate.question !== "string" || candidate.question.trim().length === 0) return false;
  if (candidate.responseMode !== "open-text" && candidate.responseMode !== "single-choice") return false;
  if (typeof candidate.allowBlankVote !== "boolean") return false;

  if (candidate.options !== undefined) {
    if (!Array.isArray(candidate.options)) return false;
    const allOptionsValid = candidate.options.every((option) => {
      if (!option || typeof option !== "object") return false;
      const typedOption = option as Partial<SurveyOption>;
      return (
        typeof typedOption.id === "string" &&
        typedOption.id.trim().length > 0 &&
        typeof typedOption.label === "string" &&
        typedOption.label.trim().length > 0
      );
    });

    if (!allOptionsValid) return false;
  }

  return true;
}

export function isResponsePayloadV1(value: unknown): value is ResponsePayloadV1 {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<ResponsePayloadV1>;
  if (candidate.version !== 1) return false;
  if (typeof candidate.surveyId !== "string" || candidate.surveyId.trim().length === 0) return false;
  if (!candidate.kind || !isSurveyKind(candidate.kind)) return false;
  if (typeof candidate.submittedAt !== "string" || candidate.submittedAt.trim().length === 0) return false;
  if (!candidate.response || typeof candidate.response !== "object") return false;

  if (candidate.response.type === "open-text") {
    return typeof candidate.response.text === "string" && candidate.response.text.trim().length > 0;
  }

  if (candidate.response.type === "single-choice") {
    return (
      typeof candidate.response.optionId === "string" &&
      candidate.response.optionId.trim().length > 0 &&
      typeof candidate.response.optionLabel === "string" &&
      candidate.response.optionLabel.trim().length > 0
    );
  }

  return false;
}
