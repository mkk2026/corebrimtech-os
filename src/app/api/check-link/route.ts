import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TIMEOUT_MS = 8_000;

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url || !url.startsWith("http://") && !url.startsWith("https://")) {
    return NextResponse.json({ active: false });
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "CBT-OS-Research/1.0 (link check)" },
    });
    clearTimeout(id);
    return NextResponse.json({ active: res.ok });
  } catch {
    clearTimeout(id);
    try {
      const getController = new AbortController();
      const getId = setTimeout(() => getController.abort(), TIMEOUT_MS);
      const res = await fetch(url, {
        method: "GET",
        signal: getController.signal,
        redirect: "follow",
        headers: { "User-Agent": "CBT-OS-Research/1.0 (link check)" },
      });
      clearTimeout(getId);
      return NextResponse.json({ active: res.ok });
    } catch {
      return NextResponse.json({ active: false });
    }
  }
}
