import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: rooms, error } = await supabase
      .from("rooms")
      .select(`
        *,
        thread_count:threads(count),
        member_count:room_members(count)
      `)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[api/rooms] Supabase error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const normalized = (rooms ?? []).map((r) => ({
      ...r,
      thread_count: Array.isArray(r.thread_count)
        ? (r.thread_count[0] as { count: number })?.count ?? 0
        : (r.thread_count as unknown as number) ?? 0,
      member_count: Array.isArray(r.member_count)
        ? (r.member_count[0] as { count: number })?.count ?? 0
        : (r.member_count as unknown as number) ?? 0,
    }));

    return NextResponse.json(normalized);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/rooms] Unexpected error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
