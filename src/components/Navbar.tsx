"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Brain, LogIn, LogOut, User } from "lucide-react";
import type { User as SupaUser } from "@supabase/supabase-js";

export function Navbar() {
  const [user, setUser] = useState<SupaUser | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <nav
      className="sticky top-0 z-50 border-b flex items-center justify-between px-4 sm:px-8 h-14"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
    >
      <Link href="/" className="flex items-center gap-2 font-bold text-lg">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #7c6fef, #4facde)" }}>
          <Brain className="w-4 h-4 text-white" />
        </div>
        <span className="gradient-text">MindThreads</span>
      </Link>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <span className="text-sm hidden sm:block" style={{ color: "var(--text-secondary)" }}>
              {user.email?.split("@")[0]}
            </span>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text-secondary)", background: "var(--bg-card)" }}
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </>
        ) : (
          <Link
            href="/auth"
            className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-lg font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #7c6fef, #4facde)" }}
          >
            <LogIn className="w-4 h-4" /> Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
