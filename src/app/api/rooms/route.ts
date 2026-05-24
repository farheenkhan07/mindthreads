import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: rooms } = await supabase
    .from("rooms")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(12);

  return NextResponse.json(rooms ?? []);
}
