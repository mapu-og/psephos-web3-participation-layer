type PinataPinResponse = {
  IpfsHash?: string;
};

export function getPinataJwt(): string {
  const jwt = process.env.IPFS_PINATA_JWT?.trim();
  if (!jwt) {
    throw new Error("Missing IPFS_PINATA_JWT");
  }
  return jwt;
}

export async function pinJsonToIpfs(name: string, content: unknown): Promise<{ cid: string }> {
  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getPinataJwt()}`,
    },
    body: JSON.stringify({
      pinataMetadata: { name },
      pinataContent: content,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Pinata upload failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as PinataPinResponse;
  if (!data.IpfsHash) {
    throw new Error("Pinata upload succeeded without IpfsHash");
  }

  return { cid: data.IpfsHash };
}
