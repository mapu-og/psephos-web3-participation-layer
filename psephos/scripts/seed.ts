import { ethers } from "hardhat";

const CONTRACT_ADDRESS = "0x6f48677A356F2e1Bce0910867f69299f89fB56b3";

interface SurveyData {
  title: string;
  ipfsHash: string;
  rewardPerResponse: bigint;
  maxResponses: bigint;
  deadlineOffset: number; // seconds from now
}

const SURVEYS: SurveyData[] = [
  {
    title: "What's your favorite L2?",
    ipfsHash: "QmYw1v1zC6ZftnWJTrjhGNs7pSqsbHwQu6vhGyAb3H6uEr",
    rewardPerResponse: ethers.parseEther("0.0005"),
    maxResponses: 3n,
    deadlineOffset: 7 * 24 * 60 * 60, // +7 days
  },
  {
    title: "DeFi vs CeFi - Your take?",
    ipfsHash: "QmdGdYaetAyNkdnUvMAvfGem9Y14i7vTo8eV7w66iDekLd",
    rewardPerResponse: ethers.parseEther("0.0005"),
    maxResponses: 3n,
    deadlineOffset: 3 * 24 * 60 * 60, // +3 days
  },
  {
    title: "Rate your Web3 experience",
    ipfsHash: "QmfH6TKw7WbWLBVc5YW1oesYvc9SUw9aKRoLLLmuHRYrSV",
    rewardPerResponse: ethers.parseEther("0.0005"),
    maxResponses: 3n,
    deadlineOffset: 14 * 24 * 60 * 60, // +14 days
  },
];

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Seeding from :", signer.address);

  const balance = await ethers.provider.getBalance(signer.address);
  console.log("Balance      :", ethers.formatEther(balance), "ETH\n");

  const contract = await ethers.getContractAt("SurveyPlatform", CONTRACT_ADDRESS);

  const nowBlock = await ethers.provider.getBlock("latest");
  if (!nowBlock) throw new Error("Could not fetch latest block");
  const now = nowBlock.timestamp;

  // Create all 3 surveys from index 0
  for (let i = 0; i < SURVEYS.length; i++) {
    const s = SURVEYS[i];
    const deadline = now + s.deadlineOffset;
    const value = s.rewardPerResponse * s.maxResponses;

    console.log(`[${i + 1}/3] Creating survey: "${s.title}"`);
    console.log(`      reward: ${ethers.formatEther(s.rewardPerResponse)} ETH x ${s.maxResponses} = ${ethers.formatEther(value)} ETH`);

    const tx = await contract.createSurvey(
      s.title,
      s.ipfsHash,
      s.rewardPerResponse,
      s.maxResponses,
      deadline,
      { value }
    );

    console.log(`      tx hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`      confirmed in block ${receipt?.blockNumber}`);

    // surveyId is nextSurveyId before the call; read it from the event
    const createdEvent = receipt?.logs
      .map((log) => {
        try {
          return contract.interface.parseLog({ topics: [...log.topics], data: log.data });
        } catch {
          return null;
        }
      })
      .find((e) => e?.name === "SurveyCreated");

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
