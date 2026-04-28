import { NextResponse } from "next/server";
import { buildIpfsUrl, isSurveyMetadataV1 } from "@/lib/psephos";
import { pinJsonToIpfs } from "@/lib/pinata";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!isSurveyMetadataV1(payload)) {
      return NextResponse.json(
        { error: "Invalid survey metadata payload." },
        { status: 400 }
      );
    }

    if (payload.kind === "survey" && payload.responseMode !== "open-text") {
      return NextResponse.json(
        { error: "Survey metadata must use open-text mode." },
        { status: 400 }
      );
    }

    if ((payload.kind === "poll" || payload.kind === "vote") && payload.responseMode !== "single-choice") {
      return NextResponse.json(
        { error: "Poll and vote metadata must use single-choice mode." },
        { status: 400 }
      );
    }

    if ((payload.kind === "poll" || payload.kind === "vote") && (!payload.options || payload.options.length < 2)) {
      return NextResponse.json(
        { error: "At least two options are required." },
        { status: 400 }
      );
    }

    const { cid } = await pinJsonToIpfs(
      `psephos-survey-metadata-${Date.now()}.json`,
      payload
    );

    return NextResponse.json({
      cid,
      url: buildIpfsUrl(cid),
    });
  } catch (error) {
    console.error("Failed to upload survey metadata to IPFS", error);

    return NextResponse.json(
      { error: "Unable to prepare survey metadata for IPFS." },
      { status: 500 }
    );
  }
}
