import {
  CONTRACT_ADDRESS,
  CONTRACT_DEPLOYMENT_BLOCK,
} from "./contract-meta";

export { CONTRACT_ADDRESS, CONTRACT_DEPLOYMENT_BLOCK };

export const SURVEY_PLATFORM_ABI = [
  // ── Constructor ──
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },

  // ── Custom Errors ──
  { inputs: [], name: "AlreadyClaimed", type: "error" },
  { inputs: [], name: "AlreadyResponded", type: "error" },
  { inputs: [], name: "DeadlineInPast", type: "error" },
  { inputs: [], name: "DidNotRespond", type: "error" },
  { inputs: [], name: "EmptyIpfsHash", type: "error" },
  { inputs: [], name: "EmptyTitle", type: "error" },
  { inputs: [], name: "IncorrectDeposit", type: "error" },
  { inputs: [], name: "InvalidSurveyId", type: "error" },
  { inputs: [], name: "MaxResponsesMustBePositive", type: "error" },
  { inputs: [], name: "MaxResponsesReached", type: "error" },
  { inputs: [], name: "NoResponseFound", type: "error" },
  { inputs: [], name: "NothingToWithdraw", type: "error" },
  { inputs: [], name: "OnlyCreator", type: "error" },
  { inputs: [], name: "ReentrancyGuardReentrantCall", type: "error" },
  { inputs: [], name: "RewardMustBePositive", type: "error" },
  { inputs: [], name: "SurveyExpired", type: "error" },
  { inputs: [], name: "SurveyNotActive", type: "error" },
  { inputs: [], name: "SurveyStillActive", type: "error" },
  { inputs: [], name: "TransferFailed", type: "error" },

  // ── Events ──
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "surveyId", type: "uint256" },
      { indexed: true, internalType: "address", name: "respondent", type: "address" },
      { indexed: false, internalType: "uint256", name: "responseIndex", type: "uint256" },
    ],
    name: "AnswerSubmitted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "surveyId", type: "uint256" },
      { indexed: true, internalType: "address", name: "respondent", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "RewardClaimed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "surveyId", type: "uint256" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
    ],
    name: "SurveyClosed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "surveyId", type: "uint256" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "string", name: "title", type: "string" },
      { indexed: false, internalType: "uint256", name: "rewardPerResponse", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "maxResponses", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "SurveyCreated",
    type: "event",
  },

  // ── Write Functions ──
  {
    inputs: [{ internalType: "uint256", name: "surveyId", type: "uint256" }],
    name: "claimReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "surveyId", type: "uint256" }],
    name: "closeSurvey",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "_title", type: "string" },
      { internalType: "string", name: "_ipfsHash", type: "string" },
      { internalType: "uint256", name: "_rewardPerResponse", type: "uint256" },
      { internalType: "uint256", name: "_maxResponses", type: "uint256" },
      { internalType: "uint256", name: "_deadline", type: "uint256" },
    ],
    name: "createSurvey",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "surveyId", type: "uint256" },
      { internalType: "string", name: "answerHash", type: "string" },
    ],
    name: "submitResponse",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "surveyId", type: "uint256" }],
    name: "withdrawRemaining",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ── View Functions ──
  {
    inputs: [],
    name: "getActiveSurveys",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "surveyId", type: "uint256" },
      { internalType: "address", name: "respondent", type: "address" },
    ],
    name: "getResponse",
    outputs: [
      {
        components: [
          { internalType: "address", name: "respondent", type: "address" },
          { internalType: "string", name: "answerHash", type: "string" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "bool", name: "claimed", type: "bool" },
        ],
        internalType: "struct SurveyPlatform.Response",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    name: "getSurvey",
    outputs: [
      {
        components: [
          { internalType: "address", name: "creator", type: "address" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "string", name: "ipfsHash", type: "string" },
          { internalType: "uint256", name: "rewardPerResponse", type: "uint256" },
          { internalType: "uint256", name: "maxResponses", type: "uint256" },
          { internalType: "uint256", name: "responseCount", type: "uint256" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
          { internalType: "uint256", name: "balance", type: "uint256" },
          { internalType: "bool", name: "active", type: "bool" },
        ],
        internalType: "struct SurveyPlatform.Survey",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getSurveyCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // ── Public mapping getters ──
  {
    inputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "address", name: "", type: "address" },
    ],
    name: "hasResponded",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextSurveyId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export type SurveyStruct = {
  creator: `0x${string}`;
  title: string;
  ipfsHash: string;
  rewardPerResponse: bigint;
  maxResponses: bigint;
  responseCount: bigint;
  deadline: bigint;
  balance: bigint;
  active: boolean;
};

export type ResponseStruct = {
  respondent: `0x${string}`;
  answerHash: string;
  timestamp: bigint;
  claimed: boolean;
};
