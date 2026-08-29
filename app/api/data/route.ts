import { NextResponse } from "next/server";
import { readData } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await readData();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Terjadi kesalahan." },
      { status: 500 }
    );
  }
}
