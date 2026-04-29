import type { Metadata } from "next";
import { Providers } from "@/providers/Providers";
import { CONTRACT_ADDRESS } from "@/config/contract";
import { Header } from "@/components/Header";
import { MeanderBorder } from "@/components/MeanderBorder";
import "./globals.css";

export const metadata: Metadata = {
  title: "Psephos — Web3 Participation Layer",
  description: "Web3 participation layer for on-chain surveys, polls, and votes on Base.",
  openGraph: {
    title: "Psephos",
    description: "Web3 participation layer for on-chain surveys, polls, and votes on Base.",
    type: "website",
  },
  icons: { icon: "/favicon.svg" },
};

function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body
        className="min-h-screen flex flex-col"
        style={{ background: "#0F1117", color: "#F5F6FA" }}
      >
        <Providers>
          <Header />
          <main className="flex-1 max-w-[1500px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {children}
          </main>
          <footer className="mt-auto" style={{ borderTop: "1px solid #2A2D3A" }}>
            <MeanderBorder color="rgba(0,229,204,0.12)" />
            <div
              className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8"
              style={{ background: "#1A1D27" }}
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Logo + tagline */}
                <div className="flex items-center gap-3">
                  <span
                    style={{
                      color: "#00E5CC",
                      fontSize: "1.4rem",
                      fontWeight: 700,
                      textShadow: "0 0 10px rgba(0,229,204,0.4)",
                    }}
                  >
                    ψ
                  </span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#F5F6FA" }}>
                      Psephos
                    </p>
                    <p className="text-xs" style={{ color: "#8B8FA3" }}>
                      web3 participation layer
                    </p>
                  </div>
                </div>

                {/* Contract address */}
                <div className="flex items-center gap-2 text-xs" style={{ color: "#8B8FA3" }}>
                  <span>Contract:</span>
                  <a
                    href={`https://sepolia.basescan.org/address/${CONTRACT_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#00E5CC",
                      textDecoration: "none",
                      fontFamily: "monospace",
                    }}
                    className="hover:opacity-75 transition-opacity"
                  >
                    {truncateAddress(CONTRACT_ADDRESS)}
                  </a>
                  <span style={{ color: "#4A4D5E" }}>on Base</span>
                </div>

                {/* Copyright */}
                <p className="text-xs" style={{ color: "#4A4D5E" }}>
                  © 2026 Psephos. Built on Base.
                </p>

                {/* MapuriteLabs badge */}
                <div className="flex items-center gap-2 mt-2">
                  <span style={{ color: "#8B8FA3", fontSize: "0.9em", fontWeight: 400, opacity: 0.7, marginLeft: 2 }}>
                    by
                  </span>
                  <span className="mapurite-badge" tabIndex={0} aria-label="MapuriteLabs" title="MapuriteLabs" style={{ outline: "none" }}>
                    MapuriteLabs
                  </span>
                </div>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
