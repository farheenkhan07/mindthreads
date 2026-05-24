"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Brain, Mail, Phone, Chrome, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

type Mode = "options" | "email" | "phone";

export default function AuthPage() {
  const clientRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getClient = () => {
    if (!clientRef.current) clientRef.current = createClient();
    return clientRef.current;
  };
  const [mode, setMode] = useState<Mode>("options");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const signInWithGoogle = async () => {
    setLoading(true);
    await getClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
  };

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const { error } = await getClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone(true);
  };

  const sendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const { error } = await getClient().auth.signInWithOtp({ phone });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setOtpSent(true);
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const { error } = await getClient().auth.verifyOtp({ phone, token: otp, type: "sms" });
    setLoading(false);
    if (error) { setError(error.message); return; }
    window.location.href = "/";
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border p-8"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7c6fef, #4facde)" }}>
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Join MindThreads</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Sign in to post, reply, and chat live
            </p>
          </div>

          {/* Success states */}
          {done && (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="font-semibold mb-1">Check your email!</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                We sent a magic link to <strong>{email}</strong>
              </p>
            </div>
          )}

          {!done && mode === "options" && (
            <div className="space-y-3">
              {/* Google */}
              <button onClick={signInWithGoogle} disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border font-medium transition-colors hover:border-purple-500/50"
                style={{ background: "var(--bg-hover)", borderColor: "var(--border)" }}>
                <Chrome className="w-5 h-5" />
                Continue with Google
              </button>

              {/* Email */}
              <button onClick={() => setMode("email")}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border font-medium transition-colors hover:border-purple-500/50"
                style={{ background: "var(--bg-hover)", borderColor: "var(--border)" }}>
                <Mail className="w-5 h-5" />
                Continue with Email
              </button>

              {/* Phone */}
              <button onClick={() => setMode("phone")}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border font-medium transition-colors hover:border-purple-500/50"
                style={{ background: "var(--bg-hover)", borderColor: "var(--border)" }}>
                <Phone className="w-5 h-5" />
                Continue with Phone
              </button>

              <p className="text-center text-xs pt-2" style={{ color: "var(--text-secondary)" }}>
                You can browse rooms without signing in.{" "}
                <Link href="/" className="underline hover:text-purple-400">Go back</Link>
              </p>
            </div>
          )}

          {/* Email form */}
          {!done && mode === "email" && (
            <form onSubmit={sendMagicLink} className="space-y-4">
              <button type="button" onClick={() => setMode("options")}
                className="flex items-center gap-1 text-sm mb-2 hover:text-purple-400 transition-colors"
                style={{ color: "var(--text-secondary)" }}>
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div>
                <label className="block text-sm font-medium mb-2">Email address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" required autoFocus
                  className="w-full px-4 py-3 rounded-xl border outline-none focus:border-purple-500 transition-colors"
                  style={{ background: "var(--bg-hover)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loading || !email}
                className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #7c6fef, #4facde)" }}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                Send Magic Link
              </button>
            </form>
          )}

          {/* Phone form */}
          {!done && mode === "phone" && (
            <div className="space-y-4">
              <button type="button" onClick={() => { setMode("options"); setOtpSent(false); }}
                className="flex items-center gap-1 text-sm mb-2 hover:text-purple-400 transition-colors"
                style={{ color: "var(--text-secondary)" }}>
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              {!otpSent ? (
                <form onSubmit={sendPhoneOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone number</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 234 567 8900" required autoFocus
                      className="w-full px-4 py-3 rounded-xl border outline-none focus:border-purple-500 transition-colors"
                      style={{ background: "var(--bg-hover)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
                    <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>Include country code e.g. +1, +91</p>
                  </div>
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  <button type="submit" disabled={loading || !phone}
                    className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #7c6fef, #4facde)" }}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                    Send OTP
                  </button>
                </form>
              ) : (
                <form onSubmit={verifyOtp} className="space-y-4">
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Enter the 6-digit code sent to <strong>{phone}</strong>
                  </p>
                  <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456" maxLength={6} required autoFocus
                    className="w-full px-4 py-3 rounded-xl border outline-none focus:border-purple-500 text-center text-2xl tracking-widest transition-colors"
                    style={{ background: "var(--bg-hover)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  <button type="submit" disabled={loading || otp.length < 6}
                    className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #7c6fef, #4facde)" }}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Sign In"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
