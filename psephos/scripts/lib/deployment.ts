import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type DeploymentInfo = {
  network: string;
  contractAddress: `0x${string}`;
  deploymentBlock: number;
  deployedAt: string;
};

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const DEPLOYMENTS_DIR = path.join(PROJECT_ROOT, "deployments");
const FRONTEND_CONTRACT_META_PATH = path.join(
  PROJECT_ROOT,
  "frontend",
  "src",
  "config",
  "contract-meta.ts"
);

function getDeploymentFilePath(networkName: string): string {
  const normalizedNetwork = networkName.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  return path.join(DEPLOYMENTS_DIR, `${normalizedNetwork}.json`);
}

export async function writeDeploymentArtifacts(info: DeploymentInfo): Promise<void> {
  await mkdir(DEPLOYMENTS_DIR, { recursive: true });

  const deploymentPath = getDeploymentFilePath(info.network);
  await writeFile(deploymentPath, JSON.stringify(info, null, 2) + "\n", "utf8");

  if (info.network === "baseSepolia") {
    const contractMetaSource = `export const CONTRACT_ADDRESS =
  "${info.contractAddress}" as const;
export const CONTRACT_DEPLOYMENT_BLOCK = BigInt(${info.deploymentBlock});
`;

    await writeFile(FRONTEND_CONTRACT_META_PATH, contractMetaSource, "utf8");
  }
}

export async function readDeploymentInfo(networkName: string): Promise<DeploymentInfo> {
  const deploymentPath = getDeploymentFilePath(networkName);
  const raw = await readFile(deploymentPath, "utf8");
  const parsed = JSON.parse(raw) as Partial<DeploymentInfo>;

  if (
    !parsed ||
    typeof parsed.network !== "string" ||
    typeof parsed.contractAddress !== "string" ||
    typeof parsed.deploymentBlock !== "number" ||
    typeof parsed.deployedAt !== "string"
  ) {
    throw new Error(`Invalid deployment metadata in ${deploymentPath}`);
  }

  return parsed as DeploymentInfo;
}
