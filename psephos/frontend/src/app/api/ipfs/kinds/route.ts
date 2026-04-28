import { NextRequest, NextResponse } from "next/server";
import { buildIpfsUrl, isSurveyMetadataV1, isValidIpfsCid, SurveyKind } from "@/lib/psephos";

export const runtime = "nodejs";

type KindLookupResult = {
  cid: string;
  kind: SurveyKind | null;
  status: "ready" | "invalid-cid" | "unavailable" | "legacy";
};

export async function GET(request: NextRequest) {
  const cids = request.nextUrl.searchParams
    .getAll("cid")
    .map((cid) => cid.trim())
    .filter(Boolean);

  if (cids.length === 0) {
    return NextResponse.json(
      { error: "At least one CID is required." },
      { status: 400 }
    );
  }

  const uniqueCids = Array.from(new Set(cids)).slice(0, 50);

  const results = await Promise.all(
    uniqueCids.map(async (cid): Promise<KindLookupResult> => {
      if (!isValidIpfsCid(cid)) {
        return { cid, kind: null, status: "invalid-cid" };
      }

      try {
        const response = await fetch(buildIpfsUrl(cid), { cache: "no-store" });

        if (!response.ok) {
          return { cid, kind: null, status: "unavailable" };
        }

        const text = await response.text();
        const parsed = JSON.parse(text) as unknown;

        if (!isSurveyMetadataV1(parsed)) {
          return { cid, kind: null, status: "legacy" };
        }

        return { cid, kind: parsed.kind, status: "ready" };
      } catch {
        return { cid, kind: null, status: "unavailable" };
      }
    })
  );

  return NextResponse.json({ results });
}
