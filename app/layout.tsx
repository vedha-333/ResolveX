import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResolveX - Voice AI Customer Resolution Agent",
  description: "Next-generation customer resolution agent powered by Vaani voice platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}

