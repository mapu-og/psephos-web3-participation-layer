"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { MeanderBorder } from "./MeanderBorder";

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "rgba(26,29,39,0.95)",
        borderBottom: "1px solid #2A2D3A",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2"
            style={{ textDecoration: "none" }}
          >
            <span
              style={{
                color: "#00E5CC",
                fontSize: "1.75rem",
                fontWeight: 700,
                textShadow:
                  "0 0 12px rgba(0,229,204,0.55), 0 0 28px rgba(0,229,204,0.25)",
                lineHeight: 1,
              }}
            >
              ψ
            </span>
            <span
              style={{
                color: "#F5F6FA",
                fontSize: "1.1rem",
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}
            >
              Psephos
            </span>
          </Link>

          {/* Center nav — desktop */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              prefetch
              className={`nav-link text-sm font-medium${
                isActive("/") && !isActive("/create") ? " active" : ""
              }`}
              style={{ textDecoration: "none" }}
            >
              Questions
            </Link>
            <Link
              href="/create"
              prefetch
              className={`nav-link text-sm font-medium${
                isActive("/create") ? " active" : ""
              }`}
              style={{ textDecoration: "none" }}
            >
              Create
            </Link>
          </nav>

          {/* Right — wallet + mobile toggle */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <ConnectButton />
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg"
              style={{ color: "#8B8FA3" }}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden px-4 pb-4">
          <div className="mobile-menu p-4 flex flex-col gap-3">
            <Link
              href="/"
              prefetch
              className={`nav-link text-sm font-medium py-2 px-3 rounded-lg${
                isActive("/") && !isActive("/create") ? " active" : ""
              }`}
              style={{ textDecoration: "none" }}
              onClick={() => setMobileOpen(false)}
            >
              Questions
            </Link>
            <Link
              href="/create"
              prefetch
              className={`nav-link text-sm font-medium py-2 px-3 rounded-lg${
                isActive("/create") ? " active" : ""
              }`}
              style={{ textDecoration: "none" }}
              onClick={() => setMobileOpen(false)}
            >
              Create
            </Link>
            <div className="my-1" style={{ borderTop: "1px solid #2A2D3A" }} />
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>
        </div>
      )}

      {/* Meander decorative line under header */}
      <MeanderBorder />
    </header>
  );
}
