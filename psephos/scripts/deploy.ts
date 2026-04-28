import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Network      :", network.name);
  console.log("Deploying as :", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance      :", ethers.formatEther(balance), "ETH");

  console.log("\nDeploying SurveyPlatform...");
  const SurveyPlatform = await ethers.getContractFactory("SurveyPlatform");
  const contract = await SurveyPlatform.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("\n✓ SurveyPlatform deployed at:", address);

  // Basic sanity check — call a view function
  const surveyCount = await contract.getSurveyCount();
  console.log("✓ getSurveyCount() =", surveyCount.toString(), "(expected 0 on fresh deploy)");

  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\nVerification command (run after a few seconds):");
    console.log(`  npx hardhat verify --network ${network.name} ${address}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
