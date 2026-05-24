import Link from "next/link";
import { Brain } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center text-center px-4">
      <div>
        <Brain className="w-16 h-16 mx-auto mb-6 opacity-20" />
        <h1 className="text-4xl font-extrabold mb-3">Room not found</h1>
        <p className="mb-8" style={{ color: "var(--text-secondary)" }}>
          This room doesn&apos;t exist yet. Type your thought on the home page to create it!
        </p>
        <Link href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #7c6fef, #4facde)" }}>
          Back to MindThreads
        </Link>
      </div>
    </div>
  );
}
