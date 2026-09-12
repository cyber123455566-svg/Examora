import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/server-auth";

export async function GET() {
  const user = await getServerUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ user });
}
