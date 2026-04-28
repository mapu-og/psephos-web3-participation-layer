import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import {
  ArrowLeft,
  Hash,
  Coins,
  Users,
  Calendar,
  ExternalLink,
  CheckCircle,
  Gift,
  AlertCircle,
  Send,
  Wallet,
  Copy,
  Check,
} from 'lucide-react';
import { mockSurveys, truncateHash, truncateAddress, formatDate, generateTxHash } from '../data/mockData';
import type { Survey } from '../data/mockData';
import { useWallet } from '../context/WalletContext';
import { MeanderBorder } from '../components/MeanderBorder';

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: Survey['status'] }) => {
  const map = {
    active: { cls: 'badge-active', label: 'Active' },
    closed: { cls: 'badge-closed', label: 'Closed' },
    expired: { cls: 'badge-expired', label: 'Expired' },
  };
  const { cls, label } = map[status];
  return (
    <span
      className={`${cls} text-xs font-semibold px-3 py-1.5 rounded-full`}
      style={{ letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.65rem' }}
    >
      {label}
    </span>
  );
};

// ── Detail row ─────────────────────────────────────────────────────────────────
const DetailRow = ({
  icon,
  label,
  value,
  valueStyle,
  mono,
  copyable,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueStyle?: React.CSSProperties;
  mono?: boolean;
  copyable?: boolean;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderBottom: '1px solid #2A2D3A' }}
    >
      <div className="flex items-center gap-2.5">
        <span style={{ color: '#8B8FA3' }}>{icon}</span>
        <span className="text-sm" style={{ color: '#8B8FA3' }}>
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="text-sm font-medium"
          style={{
            color: '#F5F6FA',
            fontFamily: mono ? 'monospace' : undefined,
            fontSize: mono ? '0.8rem' : undefined,
            ...valueStyle,
          }}
        >
          {value}
        </span>
        {copyable && (
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:opacity-75 transition-opacity"
            style={{ color: '#8B8FA3' }}
            title="Copy"
          >
            {copied ? <Check size={12} style={{ color: '#00E5CC' }} /> : <Copy size={12} />}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Tx hash display ───────────────────────────────────────────────────────────
const TxHashDisplay = ({ hash }: { hash: string }) => (
  <div
    className="flex flex-col gap-1.5 p-3 rounded-lg mt-3"
    style={{ background: '#0F1117', border: '1px solid #2A2D3A' }}
  >
    <p className="text-xs" style={{ color: '#8B8FA3' }}>
      Transaction confirmed
    </p>
    <a
      href={`https://basescan.org/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 text-xs hover:opacity-75 transition-opacity"
      style={{ color: '#00E5CC', fontFamily: 'monospace', wordBreak: 'break-all' }}
    >
      {truncateHash(hash, 18, 10)}
      <ExternalLink size={11} className="flex-shrink-0" />
    </a>
  </div>
);

// ── Not Found ─────────────────────────────────────────────────────────────────
const NotFound = () => (
  <div className="max-w-xl mx-auto px-4 py-24 text-center">
    <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>ψ</p>
    <h2 style={{ color: '#F5F6FA', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
      Survey Not Found
    </h2>
    <p className="text-sm mb-6" style={{ color: '#8B8FA3' }}>
      This survey may have been removed or the ID is invalid.
    </p>
    <Link to="/" style={{ textDecoration: 'none' }}>
      <button className="btn-primary px-5 py-2.5 text-sm font-semibold">
        Back to Surveys
      </button>
    </Link>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
export const SurveyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { isConnected, address, connect } = useWallet();

  const survey = mockSurveys.find((s) => s.id === id);

  // Per-survey action state — persisted in localStorage
  const storageKey = `psephos_survey_${id}`;
  const [hasResponded, setHasResponded] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return stored.responded === true;
    } catch {
      return false;
    }
  });
  const [hasClaimed, setHasClaimed] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return stored.claimed === true;
    } catch {
      return false;
    }
  });

  const [answerHash, setAnswerHash] = useState('');
  const [answerHashError, setAnswerHashError] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [responseTxHash, setResponseTxHash] = useState('');
  const [claimTxHash, setClaimTxHash] = useState('');

  // Persist state
  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ responded: hasResponded, claimed: hasClaimed })
    );
  }, [hasResponded, hasClaimed, storageKey]);

  if (!survey) return <NotFound />;

  const progress = Math.min((survey.currentResponses / survey.maxResponses) * 100, 100);
  const remaining = survey.maxResponses - survey.currentResponses;
  const isFull = remaining <= 0 || survey.status !== 'active';

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerHash.trim()) {
      setAnswerHashError('Answer hash is required.');
      return;
    }
    if (!/^Qm[1-9A-HJ-NP-Za-km-z]{44}/.test(answerHash)) {
      setAnswerHashError('Must be a valid IPFS CIDv0 hash (starts with Qm…).');
      return;
    }
    setAnswerHashError('');
    setSubmittingResponse(true);
    await new Promise((res) => setTimeout(res, 1800));
    const tx = generateTxHash();
    setResponseTxHash(tx);
    setHasResponded(true);
    setSubmittingResponse(false);
  };

  const handleClaimReward = async () => {
    setSubmittingClaim(true);
    await new Promise((res) => setTimeout(res, 1400));
    const tx = generateTxHash();
    setClaimTxHash(tx);
    setHasClaimed(true);
    setSubmittingClaim(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm mb-6 hover:opacity-75 transition-opacity"
        style={{ color: '#8B8FA3', textDecoration: 'none' }}
      >
        <ArrowLeft size={15} />
        All Surveys
      </Link>

      {/* Title + status */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
        <StatusBadge status={survey.status} />
        <h1
          style={{ color: '#F5F6FA', fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.3 }}
        >
          {survey.title}
        </h1>
      </div>

      {survey.description && (
        <p className="text-sm mb-8 leading-relaxed" style={{ color: '#8B8FA3' }}>
          {survey.description}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left: Details card ── */}
        <div className="lg:col-span-3">
          <div className="psephos-card p-0 overflow-hidden">
            {/* Cyan top accent */}
            <div
              style={{
                height: '3px',
                background:
                  survey.status === 'active'
                    ? 'linear-gradient(90deg, #00E5CC, rgba(0,229,204,0.2))'
                    : '#2A2D3A',
              }}
            />
            <MeanderBorder color="rgba(0,229,204,0.1)" height={10} />

            <div className="px-5 pt-3 pb-5">
              <h2
                className="mb-3"
                style={{ fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#8B8FA3' }}
              >
                Survey Details
              </h2>

              <DetailRow
                icon={<Hash size={14} />}
                label="IPFS Hash"
                value={truncateHash(survey.ipfsHash)}
                mono
                copyable
              />
              <DetailRow
                icon={<Wallet size={14} />}
                label="Creator"
                value={truncateAddress(survey.creator)}
                mono
                copyable
              />
              <DetailRow
                icon={<Coins size={14} />}
                label="Reward / Response"
                value={`${survey.rewardPerResponse.toFixed(4)} ETH`}
                valueStyle={{ color: '#00E5CC' }}
              />
              <DetailRow
                icon={<Calendar size={14} />}
                label="Deadline"
                value={formatDate(survey.deadline)}
              />
              <DetailRow
                icon={<Coins size={14} />}
                label="Contract Balance"
                value={`${survey.balance.toFixed(4)} ETH`}
              />

              {/* Responses with progress */}
              <div
                className="flex flex-col gap-2 py-3"
                style={{ borderBottom: '1px solid #2A2D3A' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Users size={14} style={{ color: '#8B8FA3' }} />
                    <span className="text-sm" style={{ color: '#8B8FA3' }}>
                      Responses
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium" style={{ color: '#F5F6FA' }}>
                      {survey.currentResponses}
                      <span style={{ color: '#8B8FA3' }}>/{survey.maxResponses}</span>
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: isFull ? '#E54D4D' : '#8B8FA3' }}
                    >
                      {isFull ? 'Full' : `${remaining} left`}
                    </span>
                  </div>
                </div>
                <div className="progress-track" style={{ height: '5px' }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${progress}%`,
                      background: isFull ? '#E54D4D' : '#00E5CC',
                      boxShadow: isFull
                        ? '0 0 6px rgba(229,77,77,0.5)'
                        : '0 0 8px rgba(0,229,204,0.4)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Action card ── */}
        <div className="lg:col-span-2">
          <div className="psephos-card p-5 flex flex-col gap-4">
            <h2
              style={{
                color: '#8B8FA3',
                fontSize: '0.9rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Participate
            </h2>

            {/* ── Not connected ── */}
            {!isConnected && (
              <div className="flex flex-col gap-4">
                <div
                  className="flex items-start gap-3 p-3 rounded-lg"
                  style={{
                    background: 'rgba(0,229,204,0.05)',
                    border: '1px solid rgba(0,229,204,0.15)',
                  }}
                >
                  <AlertCircle size={15} style={{ color: '#00E5CC', flexShrink: 0, marginTop: 1 }} />
                  <p className="text-sm" style={{ color: '#8B8FA3' }}>
                    Connect your wallet to respond to this survey and earn{' '}
                    <span style={{ color: '#00E5CC', fontWeight: 600 }}>
                      {survey.rewardPerResponse.toFixed(4)} ETH
                    </span>.
                  </p>
                </div>
                <button
                  onClick={connect}
                  className="btn-wallet flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold"
                >
                  <Wallet size={15} />
                  Connect Wallet
                </button>
              </div>
            )}

            {/* ── Survey closed / full ── */}
            {isConnected && isFull && !hasResponded && (
              <div
                className="p-4 rounded-lg flex flex-col items-center gap-3 text-center"
                style={{
                  background: 'rgba(139,143,163,0.08)',
                  border: '1px solid #2A2D3A',
                }}
              >
                <AlertCircle size={20} style={{ color: '#8B8FA3' }} />
                <p className="text-sm" style={{ color: '#8B8FA3' }}>
                  {survey.status === 'closed'
                    ? 'This survey is closed.'
                    : survey.status === 'expired'
                    ? 'This survey has expired.'
                    : 'No response slots remaining.'}
                </p>
              </div>
            )}

            {/* ── Connected, not responded, survey open ── */}
            {isConnected && !hasResponded && !isFull && (
              <form onSubmit={handleSubmitResponse} className="flex flex-col gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: '#F5F6FA' }}
                  >
                    Answer Hash
                  </label>
                  <input
                    className="psephos-input w-full px-3 py-2.5 text-sm"
                    type="text"
                    placeholder="QmAnswerHash…"
                    value={answerHash}
                    onChange={(e) => {
                      setAnswerHash(e.target.value);
                      if (answerHashError) setAnswerHashError('');
                    }}
                    style={{ fontFamily: 'monospace' }}
                  />
                  {answerHashError && (
                    <p
                      className="flex items-center gap-1.5 text-xs mt-1.5"
                      style={{ color: '#E54D4D' }}
                    >
                      <AlertCircle size={11} />
                      {answerHashError}
                    </p>
                  )}
                  <p className="text-xs mt-1.5" style={{ color: '#8B8FA3' }}>
                    IPFS CIDv0 of your encrypted answers.
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold"
                  disabled={submittingResponse}
                >
                  {submittingResponse ? (
                    <>
                      <svg
                        className="animate-spin"
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                      </svg>
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Submit Response
                    </>
                  )}
                </button>

                {responseTxHash && <TxHashDisplay hash={responseTxHash} />}
              </form>
            )}

            {/* ── Responded, not claimed ── */}
            {isConnected && hasResponded && !hasClaimed && (
              <div className="flex flex-col gap-4">
                <div
                  className="flex items-start gap-3 p-3 rounded-lg"
                  style={{
                    background: 'rgba(0,229,204,0.05)',
                    border: '1px solid rgba(0,229,204,0.2)',
                  }}
                >
                  <CheckCircle size={15} style={{ color: '#00E5CC', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#F5F6FA' }}>
                      Response Submitted
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#8B8FA3' }}>
                      Your answer has been recorded on-chain. Claim your reward below.
                    </p>
                  </div>
                </div>

                {responseTxHash && <TxHashDisplay hash={responseTxHash} />}

                <button
                  onClick={handleClaimReward}
                  className="btn-success w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold"
                  disabled={submittingClaim}
                >
                  {submittingClaim ? (
                    <>
                      <svg
                        className="animate-spin"
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                      </svg>
                      Claiming…
                    </>
                  ) : (
                    <>
                      <Gift size={14} />
                      Claim {survey.rewardPerResponse.toFixed(4)} ETH
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ── Claimed ── */}
            {isConnected && hasResponded && hasClaimed && (
              <div className="flex flex-col gap-4">
                <div
                  className="flex flex-col items-center gap-3 p-5 rounded-xl text-center"
                  style={{
                    background: 'rgba(59,109,17,0.1)',
                    border: '1px solid rgba(59,109,17,0.3)',
                    boxShadow: '0 0 20px rgba(59,109,17,0.1)',
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgba(59,109,17,0.2)',
                      border: '1px solid rgba(59,109,17,0.4)',
                    }}
                  >
                    <CheckCircle size={22} style={{ color: '#6DBF2F' }} />
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: '#F5F6FA' }}>
                      Reward Claimed ✅
                    </p>
                    <p className="text-sm mt-1" style={{ color: '#8B8FA3' }}>
                      {survey.rewardPerResponse.toFixed(4)} ETH sent to your wallet.
                    </p>
                  </div>
                </div>
                {claimTxHash && <TxHashDisplay hash={claimTxHash} />}
              </div>
            )}

            {/* Reward callout */}
            {isConnected && !hasResponded && !isFull && (
              <div
                className="flex items-center justify-between p-3 rounded-lg"
                style={{
                  background: 'rgba(0,229,204,0.05)',
                  border: '1px solid rgba(0,229,204,0.1)',
                }}
              >
                <span className="text-xs" style={{ color: '#8B8FA3' }}>
                  You'll earn
                </span>
                <span
                  className="font-bold"
                  style={{ color: '#00E5CC', textShadow: '0 0 8px rgba(0,229,204,0.3)' }}
                >
                  {survey.rewardPerResponse.toFixed(4)} ETH
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};