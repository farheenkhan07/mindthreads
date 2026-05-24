import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "MindThreads — What's on your mind?",
  description: "Type a thought. Find your room. Talk to people who get it.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
