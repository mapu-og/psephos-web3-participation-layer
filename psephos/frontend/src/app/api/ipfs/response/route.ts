import { NextResponse } from "next/server";
import { buildIpfsUrl, isResponsePayloadV1 } from "@/lib/psephos";
import { pinJsonToIpfs } from "@/lib/pinata";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!isResponsePayloadV1(payload)) {
      return NextResponse.json(
        { error: "Invalid response payload." },
        { status: 400 }
      );
    }

    const { cid } = await pinJsonToIpfs(
      `psephos-response-${payload.surveyId}-${Date.now()}.json`,
      payload
    );

    return NextResponse.json({
      cid,
      url: buildIpfsUrl(cid),
    });
  } catch (error) {
    console.error("Failed to upload response payload to IPFS", error);

    return NextResponse.json(
      { error: "Unable to prepare response data for IPFS." },
      { status: 500 }
    );
  }
}
