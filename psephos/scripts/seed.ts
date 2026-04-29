import { ethers } from "hardhat";

const CONTRACT_ADDRESS = "0x6f48677A356F2e1Bce0910867f69299f89fB56b3";
const PINATA_API_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

type SurveyKind = "survey" | "poll" | "vote";

type SurveyOption = {
  id: string;
  label: string;
};

type SurveyMetadataV1 = {
  version: 1;
  kind: SurveyKind;
  question: string;
  description?: string;
  options?: SurveyOption[];
  responseMode: "open-text" | "single-choice";
  allowBlankVote: boolean;
};

type SurveySeedConfig = {
  title: string;
  metadata: SurveyMetadataV1;
  rewardPerResponse: bigint;
  maxResponses: bigint;
  deadlineOffset: number;
};

const SURVEY_EXAMPLES: SurveySeedConfig[] = [
  {
    title: "What would improve your Web3 onboarding experience?",
    metadata: {
      version: 1,
      kind: "survey",
      question: "What would improve your Web3 onboarding experience?",
      description:
        "Share one concrete change that would make a Web3 product easier to understand, trust, or use.",
      responseMode: "open-text",
      allowBlankVote: false,
    },
    rewardPerResponse: ethers.parseEther("0.0005"),
    maxResponses: 3n,
    deadlineOffset: 7 * 24 * 60 * 60,
  },
  {
    title: "Which Layer 2 do you use most often?",
    metadata: {
      version: 1,
      kind: "poll",
      question: "Which Layer 2 do you use most often?",
      description: "Choose the Layer 2 you use most frequently right now.",
      options: [
        { id: "base", label: "Base" },
        { id: "arbitrum", label: "Arbitrum" },
        { id: "optimism", label: "Optimism" },
      ],
      responseMode: "single-choice",
      allowBlankVote: false,
    },
    rewardPerResponse: ethers.parseEther("0.0005"),
    maxResponses: 3n,
    deadlineOffset: 10 * 24 * 60 * 60,
  },
  {
    title: "Which feature should Psephos prioritize next?",
    metadata: {
      version: 1,
      kind: "vote",
      question: "Which feature should Psephos prioritize next?",
      description: "Vote on the next product priority for the platform roadmap.",
      options: [
        { id: "private-responses", label: "Private responses" },
        { id: "token-gated-voting", label: "Token-gated voting" },
        { id: "creator-analytics", label: "Creator analytics" },
        { id: "blank-vote", label: "Blank Vote" },
      ],
      responseMode: "single-choice",
      allowBlankVote: true,
    },
    rewardPerResponse: ethers.parseEther("0.0005"),
    maxResponses: 3n,
    deadlineOffset: 14 * 24 * 60 * 60,
  },
];

type PinataPinResponse = {
  IpfsHash?: string;
};

function getPinataJwt(): string {
  const jwt = process.env.IPFS_PINATA_JWT?.trim();
  if (!jwt) {
    throw new Error("Missing IPFS_PINATA_JWT in .env. The seed script now uploads real metadata to IPFS.");
  }
  return jwt;
}

async function pinJsonToIpfs(name: string, content: SurveyMetadataV1): Promise<string> {
  const response = await fetch(PINATA_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getPinataJwt()}`,
    },
    body: JSON.stringify({
      pinataMetadata: { name },
      pinataContent: content,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Pinata upload failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as PinataPinResponse;
  if (!data.IpfsHash) {
    throw new Error("Pinata upload succeeded without IpfsHash");
  }

  return data.IpfsHash;
}

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Seeding from :", signer.address);

  const balance = await ethers.provider.getBalance(signer.address);
  console.log("Balance      :", ethers.formatEther(balance), "ETH\n");

  const contract = await ethers.getContractAt("SurveyPlatform", CONTRACT_ADDRESS);

  const nowBlock = await ethers.provider.getBlock("latest");
  if (!nowBlock) throw new Error("Could not fetch latest block");
  const now = nowBlock.timestamp;

  for (let i = 0; i < SURVEY_EXAMPLES.length; i++) {
    const item = SURVEY_EXAMPLES[i];
    const deadline = now + item.deadlineOffset;
    const value = item.rewardPerResponse * item.maxResponses;

    console.log(`[${i + 1}/3] Uploading metadata for: "${item.title}"`);
    const cid = await pinJsonToIpfs(
      `psephos-seed-${item.metadata.kind}-${Date.now()}-${i + 1}.json`,
      item.metadata
    );
    console.log(`      metadata CID: ${cid}`);

    console.log(`[${i + 1}/3] Creating ${item.metadata.kind}: "${item.title}"`);
    console.log(
      `      reward: ${ethers.formatEther(item.rewardPerResponse)} ETH x ${item.maxResponses} = ${ethers.formatEther(value)} ETH`
    );

    const tx = await contract.createSurvey(
      item.title,
      cid,
      item.rewardPerResponse,
      item.maxResponses,
      deadline,
      { value }
    );

    console.log(`      tx hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`      confirmed in block ${receipt?.blockNumber}`);

    const createdEvent = receipt?.logs
      .map((log) => {
        try {
          return contract.interface.parseLog({ topics: [...log.topics], data: log.data });
        } catch {
          return null;
        }
      })
      .find((entry) => entry?.name === "SurveyCreated");

    const surveyId = createdEvent ? createdEvent.args[0].toString() : "unknown";
    console.log(`      surveyId: ${surveyId}\n`);
  }

  const total = await contract.getSurveyCount();
  console.log(`Total surveys in contract: ${total.toString()}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
