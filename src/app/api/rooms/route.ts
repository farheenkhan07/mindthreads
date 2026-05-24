import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: rooms, error } = await supabase
      .from("rooms")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(12);

    if (error) {
      console.error("[api/rooms] Supabase error:", error.message, error.details);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(rooms ?? []);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/rooms] Unexpected error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
