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

// ── Detail row ────────────────────���───────────────────────────────────────────
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
          <div className="psephos-card p-5 flex flex-col">

            {/* ── Panel header ── */}
            <div className="flex items-center justify-between mb-6">
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
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: 'rgba(0,229,204,0.08)',
                  border: '1px solid rgba(0,229,204,0.2)',
                  color: '#00E5CC',
                }}
              >
                {survey.rewardPerResponse.toFixed(4)} ETH
              </span>
            </div>

            {/* ── Vertical 3-step stepper — always fully visible ── */}
            {(() => {
              const surveyUnavailable = isFull && !hasResponded;
              // step: 1=connect, 2=answer, 3=claim, 4=done
              const step = !isConnected ? 1 : !hasResponded ? 2 : !hasClaimed ? 3 : 4;

              const statusOf = (n: number): 'done' | 'active' | 'locked' => {
                if (step > n) return 'done';
                if (step === n) return 'active';
                return 'locked';
              };

              // Circle node
              const Node = (n: number, st: 'done' | 'active' | 'locked') => (
                <div
                  style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background:
                      st === 'done' ? '#00E5CC'
                      : st === 'active' ? 'rgba(0,229,204,0.12)'
                      : '#0F1117',
                    border: `2px solid ${st === 'locked' ? '#2A2D3A' : '#00E5CC'}`,
                    color: st === 'done' ? '#0F1117' : st === 'active' ? '#00E5CC' : '#3A3D4E',
                    fontSize: '0.7rem', fontWeight: 700,
                    boxShadow: st === 'active' ? '0 0 14px rgba(0,229,204,0.4)' : 'none',
                    transition: 'all 0.35s ease',
                  }}
                >
                  {st === 'done' ? <Check size={13} /> : n}
                </div>
              );

              // Vertical connector
              const Line = (filled: boolean) => (
                <div
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 20,
                    background: filled ? '#00E5CC' : '#2A2D3A',
                    opacity: 0.55,
                    transition: 'background 0.5s ease',
                    margin: '3px 0',
                  }}
                />
              );

              // Status pill
              const Pill = (label: string, green = false) => (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: green ? 'rgba(59,109,17,0.15)' : 'rgba(0,229,204,0.1)',
                    color: green ? '#6DBF2F' : '#00E5CC',
                    border: `1px solid ${green ? 'rgba(59,109,17,0.3)' : 'rgba(0,229,204,0.2)'}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </span>
              );

              return (
                <div className="flex flex-col">

                  {/* ════════════════════════════════
                      STEP 1 — Connect Wallet
                  ════════════════════════════════ */}
                  <div className="flex gap-3">
                    {/* Left: node + line */}
                    <div className="flex flex-col items-center" style={{ width: 32 }}>
                      {Node(1, statusOf(1))}
                      {Line(step > 1)}
                    </div>

                    {/* Right: content */}
                    <div className="flex-1 pb-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: statusOf(1) !== 'locked' ? '#F5F6FA' : '#3A3D4E' }}
                        >
                          Connect Wallet
                        </span>
                        {statusOf(1) === 'done' && Pill('Connected ✓')}
                      </div>

                      {/* Active */}
                      {statusOf(1) === 'active' && (
                        <div className="flex flex-col gap-3">
                          <p className="text-xs leading-relaxed" style={{ color: '#8B8FA3' }}>
                            Connect to earn{' '}
                            <span style={{ color: '#00E5CC', fontWeight: 600 }}>
                              {survey.rewardPerResponse.toFixed(4)} ETH
                            </span>{' '}
                            for your response.
                          </p>
                          <button
                            onClick={connect}
                            className="btn-wallet flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold"
                          >
                            <Wallet size={14} />
                            Connect Wallet
                          </button>
                        </div>
                      )}

                      {/* Done */}
                      {statusOf(1) === 'done' && address && (
                        <p
                          className="text-xs"
                          style={{ color: '#8B8FA3', fontFamily: 'monospace' }}
                        >
                          {truncateAddress(address)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ════════════════════════════════
                      STEP 2 — Submit Answer
                  ════════════════════════════════ */}
                  <div className="flex gap-3">
                    {/* Left: node + line */}
                    <div className="flex flex-col items-center" style={{ width: 32 }}>
                      {Node(2, statusOf(2))}
                      {Line(step > 2)}
                    </div>

                    {/* Right: content */}
                    <div className="flex-1 pb-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: statusOf(2) !== 'locked' ? '#F5F6FA' : '#3A3D4E' }}
                        >
                          Submit Answer
                        </span>
                        {statusOf(2) === 'done' && Pill('Submitted ✓')}
                      </div>

                      {/* Active — survey unavailable */}
                      {statusOf(2) === 'active' && surveyUnavailable && (
                        <div
                          className="flex items-start gap-2.5 p-3 rounded-lg"
                          style={{
                            background: 'rgba(139,143,163,0.06)',
                            border: '1px solid #2A2D3A',
                          }}
                        >
                          <AlertCircle size={14} style={{ color: '#8B8FA3', flexShrink: 0, marginTop: 1 }} />
                          <p className="text-xs" style={{ color: '#8B8FA3' }}>
                            {survey.status === 'closed'
                              ? 'This survey is closed.'
                              : survey.status === 'expired'
                              ? 'This survey has expired.'
                              : 'No response slots remaining.'}
                          </p>
                        </div>
                      )}

                      {/* Active — form */}
                      {statusOf(2) === 'active' && !surveyUnavailable && (
                        <form onSubmit={handleSubmitResponse} className="flex flex-col gap-3">
                          {/* Reward callout */}
                          <div
                            className="flex items-center justify-between px-2.5 py-2 rounded-lg"
                            style={{
                              background: 'rgba(0,229,204,0.05)',
                              border: '1px solid rgba(0,229,204,0.1)',
                            }}
                          >
                            <span className="text-xs" style={{ color: '#8B8FA3' }}>Reward</span>
                            <span
                              className="font-bold"
                              style={{
                                color: '#00E5CC',
                                textShadow: '0 0 8px rgba(0,229,204,0.3)',
                              }}
                            >
                              {survey.rewardPerResponse.toFixed(4)} ETH
                            </span>
                          </div>

                          <div>
                            <input
                              className="psephos-input w-full px-3 py-2.5 text-sm"
                              type="text"
                              placeholder="QmYourAnswerHash…"
                              value={answerHash}
                              onChange={(e) => {
                                setAnswerHash(e.target.value);
                                if (answerHashError) setAnswerHashError('');
                              }}
                              style={{ fontFamily: 'monospace' }}
                            />
                            {answerHashError ? (
                              <p
                                className="flex items-center gap-1 text-xs mt-1.5"
                                style={{ color: '#E54D4D' }}
                              >
                                <AlertCircle size={10} />
                                {answerHashError}
                              </p>
                            ) : (
                              <p className="text-xs mt-1.5" style={{ color: '#8B8FA3' }}>
                                IPFS CIDv0 of your encrypted answers.
                              </p>
                            )}
                          </div>

                          <button
                            type="submit"
                            className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold"
                            disabled={submittingResponse}
                          >
                            {submittingResponse ? (
                              <>
                                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                                </svg>
                                Broadcasting…
                              </>
                            ) : (
                              <><Send size={13} />Submit Response</>
                            )}
                          </button>

                          {responseTxHash && <TxHashDisplay hash={responseTxHash} />}
                        </form>
                      )}

                      {/* Done */}
                      {statusOf(2) === 'done' && (
                        <div>
                          <p className="text-xs" style={{ color: '#8B8FA3' }}>
                            Answer recorded on-chain.
                          </p>
                          {responseTxHash && <TxHashDisplay hash={responseTxHash} />}
                        </div>
                      )}

                      {/* Locked */}
                      {statusOf(2) === 'locked' && (
                        <p className="text-xs" style={{ color: '#3A3D4E' }}>
                          Connect your wallet to proceed.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ════════════════════════════════
                      STEP 3 — Claim Reward
                  ════════════════════════════════ */}
                  <div className="flex gap-3">
                    {/* Left: node only (last step — no line below) */}
                    <div
                      className="flex flex-col items-center"
                      style={{ width: 32, paddingTop: 0 }}
                    >
                      {Node(3, statusOf(3))}
                    </div>

                    {/* Right: content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: statusOf(3) !== 'locked' ? '#F5F6FA' : '#3A3D4E' }}
                        >
                          Claim Reward
                        </span>
                        {statusOf(3) === 'done' && Pill('Claimed ✓', true)}
                      </div>

                      {/* Active */}
                      {statusOf(3) === 'active' && (
                        <div className="flex flex-col gap-3">
                          {/* Claimable balance */}
                          <div
                            className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                            style={{
                              background: 'rgba(59,109,17,0.08)',
                              border: '1px solid rgba(59,109,17,0.28)',
                            }}
                          >
                            <div>
                              <p className="text-xs" style={{ color: '#8B8FA3' }}>
                                Claimable
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: '#4A4D5E' }}>
                                Ready to withdraw
                              </p>
                            </div>
                            <span
                              style={{
                                color: '#6DBF2F',
                                fontWeight: 700,
                                fontSize: '1.1rem',
                                textShadow: '0 0 10px rgba(59,109,17,0.5)',
                              }}
                            >
                              {survey.rewardPerResponse.toFixed(4)}
                              <span style={{ fontSize: '0.7rem', fontWeight: 500, marginLeft: 3 }}>
                                ETH
                              </span>
                            </span>
                          </div>

                          <button
                            onClick={handleClaimReward}
                            className="btn-success w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold"
                            disabled={submittingClaim}
                          >
                            {submittingClaim ? (
                              <>
                                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                                </svg>
                                Sending…
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

                      {/* Done */}
                      {statusOf(3) === 'done' && (
                        <div className="flex flex-col gap-3">
                          <div
                            className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                            style={{
                              background: 'rgba(59,109,17,0.1)',
                              border: '1px solid rgba(59,109,17,0.25)',
                              boxShadow: '0 0 16px rgba(59,109,17,0.1)',
                            }}
                          >
                            <div>
                              <p className="text-xs" style={{ color: '#8B8FA3' }}>Received</p>
                              <p className="text-xs mt-0.5" style={{ color: '#4A4D5E' }}>
                                Sent to your wallet
                              </p>
                            </div>
                            <span
                              style={{
                                color: '#6DBF2F',
                                fontWeight: 700,
                                fontSize: '1.1rem',
                                textShadow: '0 0 8px rgba(59,109,17,0.5)',
                              }}
                            >
                              {survey.rewardPerResponse.toFixed(4)}
                              <span style={{ fontSize: '0.7rem', fontWeight: 500, marginLeft: 3 }}>
                                ETH
                              </span>
                            </span>
                          </div>
                          {claimTxHash && <TxHashDisplay hash={claimTxHash} />}
                        </div>
                      )}

                      {/* Locked */}
                      {statusOf(3) === 'locked' && (
                        <p className="text-xs" style={{ color: '#3A3D4E' }}>
                          Submit your answer to unlock.
                        </p>
                      )}
                    </div>
                  </div>

                </div>
              );
            })()}

          </div>
        </div>
      </div>
    </div>
  );
};