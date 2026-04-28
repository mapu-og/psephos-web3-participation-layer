import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import { Menu, X, Waves } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { MeanderBorder } from './MeanderBorder';
import { truncateAddress } from '../data/mockData';

const CONTRACT_ADDRESS = '0xD3cEnTrAlIZeD000SuRvEy000PsEpHoS00000BASE';
const BASESCAN_URL = `https://basescan.org/address/${CONTRACT_ADDRESS}`;

export const Layout = () => {
  const { isConnected, address, connect, disconnect } = useWallet();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#0F1117', color: '#F5F6FA' }}
    >
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(26,29,39,0.95)',
          borderBottom: '1px solid #2A2D3A',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 no-underline"
              style={{ textDecoration: 'none' }}
            >
              <span
                style={{
                  color: '#00E5CC',
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  textShadow: '0 0 12px rgba(0,229,204,0.55), 0 0 28px rgba(0,229,204,0.25)',
                  lineHeight: 1,
                }}
              >
                ψ
              </span>
              <span
                style={{
                  color: '#F5F6FA',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              >
                Psephos
              </span>
            </Link>

            {/* Center nav — desktop */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                to="/"
                className={`nav-link text-sm font-medium ${isActive('/') && !isActive('/create') ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                Surveys
              </Link>
              <Link
                to="/create"
                className={`nav-link text-sm font-medium ${isActive('/create') ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                Create
              </Link>
            </nav>

            {/* Right — wallet + mobile toggle */}
            <div className="flex items-center gap-3">
              {/* Wallet button */}
              {isConnected && address ? (
                <button
                  onClick={disconnect}
                  className="btn-wallet connected hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium"
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: '#00E5CC', boxShadow: '0 0 6px #00E5CC' }}
                  />
                  {truncateAddress(address)}
                </button>
              ) : (
                <button
                  onClick={connect}
                  className="btn-wallet hidden sm:flex items-center px-4 py-2 text-sm font-medium"
                >
                  Connect Wallet
                </button>
              )}

              {/* Mobile hamburger */}
              <button
                className="md:hidden p-2 rounded-lg"
                style={{ color: '#8B8FA3' }}
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
                to="/"
                className={`nav-link text-sm font-medium py-2 px-3 rounded-lg ${isActive('/') && !isActive('/create') ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
                onClick={() => setMobileOpen(false)}
              >
                Surveys
              </Link>
              <Link
                to="/create"
                className={`nav-link text-sm font-medium py-2 px-3 rounded-lg ${isActive('/create') ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
                onClick={() => setMobileOpen(false)}
              >
                Create Survey
              </Link>
              <div
                className="my-1"
                style={{ borderTop: '1px solid #2A2D3A' }}
              />
              {isConnected && address ? (
                <button
                  onClick={() => { disconnect(); setMobileOpen(false); }}
                  className="btn-wallet connected flex items-center gap-2 px-4 py-2 text-sm font-medium w-full justify-center"
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: '#00E5CC', boxShadow: '0 0 6px #00E5CC' }}
                  />
                  {truncateAddress(address)} — Disconnect
                </button>
              ) : (
                <button
                  onClick={() => { connect(); setMobileOpen(false); }}
                  className="btn-wallet flex items-center justify-center px-4 py-2 text-sm font-medium"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        )}

        {/* Meander decorative line under header */}
        <MeanderBorder />
      </header>

      {/* ── Page content ── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer
        className="mt-auto"
        style={{ borderTop: '1px solid #2A2D3A' }}
      >
        <MeanderBorder color="rgba(0,229,204,0.12)" />
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
          style={{ background: '#1A1D27' }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Logo + tagline */}
            <div className="flex items-center gap-3">
              <span
                style={{
                  color: '#00E5CC',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  textShadow: '0 0 10px rgba(0,229,204,0.4)',
                }}
              >
                ψ
              </span>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: '#F5F6FA' }}
                >
                  Psephos
                </p>
                <p
                  className="text-xs"
                  style={{ color: '#8B8FA3' }}
                >
                  Decentralized survey infrastructure
                </p>
              </div>
            </div>

            {/* Contract address */}
            <div className="flex items-center gap-2 text-xs" style={{ color: '#8B8FA3' }}>
              <Waves size={12} style={{ color: '#00E5CC' }} />
              <span>Contract:</span>
              <a
                href={BASESCAN_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#00E5CC', textDecoration: 'none', fontFamily: 'monospace' }}
                className="hover:opacity-75 transition-opacity"
              >
                {truncateAddress(CONTRACT_ADDRESS)}
              </a>
              <span style={{ color: '#4A4D5E' }}>on Base</span>
            </div>

            {/* Copyright */}
            <p className="text-xs" style={{ color: '#4A4D5E' }}>
              © 2026 Psephos. Built on Base.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
