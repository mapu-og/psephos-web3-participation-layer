import { ethers, network } from "hardhat";
import { writeDeploymentArtifacts } from "./lib/deployment";

async function waitForFreshRead(contract: Awaited<ReturnType<typeof ethers.getContractFactory>> extends never ? never : any) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await contract.getSurveyCount();
    } catch (error) {
      if (attempt === 3) {
        console.warn("! Post-deploy read check failed after 3 attempts.");
        console.warn(error);
        return null;
      }

      console.log(`! getSurveyCount() retry ${attempt}/3 after RPC returned stale data...`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  return null;
}

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
  const deploymentReceipt = await contract.deploymentTransaction()?.wait();

  if (!deploymentReceipt?.blockNumber) {
    throw new Error("Deployment receipt missing block number");
  }

  await writeDeploymentArtifacts({
    network: network.name,
    contractAddress: address as `0x${string}`,
    deploymentBlock: deploymentReceipt.blockNumber,
    deployedAt: new Date().toISOString(),
  });

  console.log("\n✓ SurveyPlatform deployed at:", address);
  console.log("✓ Deployment block:", deploymentReceipt.blockNumber);
  console.log("✓ Deployment metadata written for", network.name);

  const surveyCount = await waitForFreshRead(contract);
  if (surveyCount !== null) {
    console.log("✓ getSurveyCount() =", surveyCount.toString(), "(expected 0 on fresh deploy)");
  }

  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\nVerification command (run after a few seconds):");
    console.log(`  npx hardhat verify --network ${network.name} ${address}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
