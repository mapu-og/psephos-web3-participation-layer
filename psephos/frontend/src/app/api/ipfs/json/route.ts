import { NextRequest, NextResponse } from "next/server";
import { buildIpfsUrl, isValidIpfsCid } from "@/lib/psephos";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const cid = request.nextUrl.searchParams.get("cid")?.trim() ?? "";

  if (!cid || !isValidIpfsCid(cid)) {
    return NextResponse.json(
      { error: "Invalid IPFS CID." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(buildIpfsUrl(cid), {
      cache: "no-store",
    });

    if (response.status === 400 || response.status === 403 || response.status === 404) {
      return NextResponse.json(
        { error: "IPFS content is unavailable for this CID." },
        { status: 404 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: "Unable to resolve IPFS content right now." },
        { status: 502 }
      );
    }

    const text = await response.text();

    try {
      const payload = JSON.parse(text) as unknown;
      return NextResponse.json(payload);
    } catch {
      return NextResponse.json(
        { error: "IPFS content is not valid JSON." },
        { status: 422 }
      );
    }
  } catch (error) {
    console.error("Failed to fetch IPFS JSON", error);

    return NextResponse.json(
      { error: "Unable to reach the IPFS gateway." },
      { status: 502 }
    );
  }
}
