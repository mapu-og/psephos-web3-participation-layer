import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import {
  CheckCircle,
  ExternalLink,
  ArrowRight,
  Info,
  Hash,
  Coins,
  Users,
  Calendar,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { generateTxHash } from '../data/mockData';
import { useWallet } from '../context/WalletContext';

interface FormData {
  title: string;
  ipfsHash: string;
  rewardPerResponse: string;
  maxResponses: string;
  deadline: string;
}

interface FormErrors {
  title?: string;
  ipfsHash?: string;
  rewardPerResponse?: string;
  maxResponses?: string;
  deadline?: string;
}

const InputField = ({
  label,
  icon,
  hint,
  error,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <label
      className="flex items-center gap-2 text-sm font-medium"
      style={{ color: '#F5F6FA' }}
    >
      <span style={{ color: '#00E5CC' }}>{icon}</span>
      {label}
    </label>
    {children}
    {hint && !error && (
      <p className="flex items-center gap-1.5 text-xs" style={{ color: '#8B8FA3' }}>
        <Info size={11} />
        {hint}
      </p>
    )}
    {error && (
      <p className="flex items-center gap-1.5 text-xs" style={{ color: '#E54D4D' }}>
        <AlertCircle size={11} />
        {error}
      </p>
    )}
  </div>
);

export const CreateSurvey = () => {
  const { isConnected, connect } = useWallet();
  const [form, setForm] = useState<FormData>({
    title: '',
    ipfsHash: '',
    rewardPerResponse: '',
    maxResponses: '',
    deadline: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [createdSurveyId] = useState('new');

  const totalDeposit =
    form.rewardPerResponse && form.maxResponses
      ? (parseFloat(form.rewardPerResponse) * parseInt(form.maxResponses, 10)).toFixed(6)
      : null;

  const minDeadline = new Date();
  minDeadline.setDate(minDeadline.getDate() + 1);
  const minDeadlineStr = minDeadline.toISOString().split('T')[0];

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.title.trim()) e.title = 'Title is required.';
    else if (form.title.length < 5) e.title = 'Title must be at least 5 characters.';

    if (!form.ipfsHash.trim()) e.ipfsHash = 'IPFS hash is required.';
    else if (!/^Qm[1-9A-HJ-NP-Za-km-z]{44}/.test(form.ipfsHash))
      e.ipfsHash = 'Must be a valid IPFS CIDv0 hash (starts with Qm…).';

    const reward = parseFloat(form.rewardPerResponse);
    if (!form.rewardPerResponse) e.rewardPerResponse = 'Reward is required.';
    else if (isNaN(reward) || reward <= 0) e.rewardPerResponse = 'Must be a positive number.';
    else if (reward < 0.0001) e.rewardPerResponse = 'Minimum reward is 0.0001 ETH.';

    const maxR = parseInt(form.maxResponses, 10);
    if (!form.maxResponses) e.maxResponses = 'Max responses is required.';
    else if (isNaN(maxR) || maxR < 1) e.maxResponses = 'Must be at least 1.';
    else if (maxR > 10000) e.maxResponses = 'Cannot exceed 10,000 responses.';

    if (!form.deadline) e.deadline = 'Deadline is required.';
    else if (form.deadline < minDeadlineStr) e.deadline = 'Deadline must be in the future.';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    // Simulate chain transaction
    await new Promise((res) => setTimeout(res, 1800));
    setTxHash(generateTxHash());
    setSubmitting(false);
    setSuccess(true);
  };

  // Success screen
  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-16">
        <div
          className="psephos-card p-8 flex flex-col items-center text-center gap-6"
          style={{ border: '1px solid rgba(59,109,17,0.4)' }}
        >
          {/* Green check */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(59,109,17,0.15)',
              border: '1px solid rgba(59,109,17,0.4)',
              boxShadow: '0 0 20px rgba(59,109,17,0.3)',
            }}
          >
            <CheckCircle size={32} style={{ color: '#6DBF2F' }} />
          </div>

          <div>
            <h2
              className="mb-1"
              style={{ color: '#F5F6FA', fontSize: '1.25rem', fontWeight: 700 }}
            >
              Survey Created!
            </h2>
            <p style={{ color: '#8B8FA3', fontSize: '0.875rem' }}>
              Your survey is now live on-chain and accepting responses.
            </p>
          </div>

          {/* Tx hash */}
          <div
            className="w-full p-3 rounded-lg flex flex-col gap-1.5"
            style={{ background: '#0F1117', border: '1px solid #2A2D3A' }}
          >
            <p className="text-xs font-medium" style={{ color: '#8B8FA3' }}>
              Transaction Hash
            </p>
            <a
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs hover:opacity-75 transition-opacity"
              style={{ color: '#00E5CC', fontFamily: 'monospace', wordBreak: 'break-all' }}
            >
              {txHash}
              <ExternalLink size={11} className="flex-shrink-0" />
            </a>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Link
              to={`/survey/${createdSurveyId}`}
              style={{ textDecoration: 'none', flex: 1 }}
            >
              <button className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold">
                View Survey
                <ArrowRight size={15} />
              </button>
            </Link>
            <button
              onClick={() => {
                setSuccess(false);
                setForm({ title: '', ipfsHash: '', rewardPerResponse: '', maxResponses: '', deadline: '' });
                setTxHash('');
              }}
              className="btn-ghost flex-1 py-3 text-sm font-medium"
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Page heading */}
      <div className="mb-8">
        <h1
          className="mb-1"
          style={{ color: '#F5F6FA', fontSize: '1.6rem', fontWeight: 700 }}
        >
          Create Survey
        </h1>
        <p style={{ color: '#8B8FA3', fontSize: '0.875rem' }}>
          Deploy an on-chain survey with ETH rewards for verified responses.
        </p>
      </div>

      {/* Wallet warning */}
      {!isConnected && (
        <div
          className="flex items-center justify-between gap-4 p-4 rounded-xl mb-6"
          style={{
            background: 'rgba(229,77,77,0.07)',
            border: '1px solid rgba(229,77,77,0.25)',
          }}
        >
          <div className="flex items-center gap-3">
            <AlertCircle size={16} style={{ color: '#E54D4D', flexShrink: 0 }} />
            <p className="text-sm" style={{ color: '#F5F6FA' }}>
              Connect your wallet to deploy a survey contract.
            </p>
          </div>
          <button
            onClick={connect}
            className="btn-wallet flex-shrink-0 px-3 py-1.5 text-xs font-medium"
          >
            Connect
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div
          className="psephos-card p-6 flex flex-col gap-6"
          style={{ borderRadius: '12px' }}
        >
          {/* Title */}
          <InputField
            label="Survey Title"
            icon={<FileText size={14} />}
            hint="A clear, concise title for your survey."
            error={errors.title}
          >
            <input
              className="psephos-input w-full px-4 py-3 text-sm"
              type="text"
              placeholder="e.g. DeFi Protocol User Satisfaction"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              maxLength={120}
            />
          </InputField>

          {/* IPFS Hash */}
          <InputField
            label="IPFS Hash"
            icon={<Hash size={14} />}
            hint="CIDv0 hash of the survey questions stored on IPFS (starts with Qm…)."
            error={errors.ipfsHash}
          >
            <input
              className="psephos-input w-full px-4 py-3 text-sm"
              type="text"
              placeholder="QmX7Y8Z9AbCdEfGhIjKl…"
              value={form.ipfsHash}
              onChange={(e) => handleChange('ipfsHash', e.target.value)}
              style={{ fontFamily: 'monospace' }}
            />
          </InputField>

          {/* Reward + Max — two column */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Reward per response */}
            <InputField
              label="Reward per Response"
              icon={<Coins size={14} />}
              hint="ETH paid to each respondent."
              error={errors.rewardPerResponse}
            >
              <div className="relative">
                <input
                  className="psephos-input w-full px-4 py-3 pr-14 text-sm"
                  type="number"
                  placeholder="0.005"
                  step="0.0001"
                  min="0.0001"
                  value={form.rewardPerResponse}
                  onChange={(e) => handleChange('rewardPerResponse', e.target.value)}
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
                  style={{ color: '#00E5CC' }}
                >
                  ETH
                </span>
              </div>
            </InputField>

            {/* Max responses */}
            <InputField
              label="Max Responses"
              icon={<Users size={14} />}
              hint="Maximum number of paid responses."
              error={errors.maxResponses}
            >
              <input
                className="psephos-input w-full px-4 py-3 text-sm"
                type="number"
                placeholder="100"
                min="1"
                max="10000"
                step="1"
                value={form.maxResponses}
                onChange={(e) => handleChange('maxResponses', e.target.value)}
              />
            </InputField>
          </div>

          {/* Deadline */}
          <InputField
            label="Deadline"
            icon={<Calendar size={14} />}
            hint="Responses after this date will not be accepted."
            error={errors.deadline}
          >
            <input
              className="psephos-input w-full px-4 py-3 text-sm"
              type="date"
              min={minDeadlineStr}
              value={form.deadline}
              onChange={(e) => handleChange('deadline', e.target.value)}
              style={{ colorScheme: 'dark' }}
            />
          </InputField>

          {/* Total deposit callout */}
          {totalDeposit && (
            <div
              className="flex items-center justify-between p-4 rounded-xl"
              style={{
                background: 'rgba(0,229,204,0.06)',
                border: '1px solid rgba(0,229,204,0.2)',
              }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: '#F5F6FA' }}>
                  Total Deposit Required
                </p>
                <p className="text-xs" style={{ color: '#8B8FA3' }}>
                  {form.rewardPerResponse} ETH × {form.maxResponses} responses
                </p>
              </div>
              <div className="text-right">
                <p
                  className="font-bold"
                  style={{
                    color: '#00E5CC',
                    fontSize: '1.4rem',
                    textShadow: '0 0 10px rgba(0,229,204,0.35)',
                  }}
                >
                  {totalDeposit}
                </p>
                <p className="text-xs" style={{ color: '#00E5CC', opacity: 0.7 }}>
                  ETH
                </p>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold mt-2"
            disabled={submitting || !isConnected}
            style={{ opacity: !isConnected ? 0.45 : undefined, cursor: !isConnected ? 'not-allowed' : undefined }}
          >
            {submitting ? (
              <>
                <svg
                  className="animate-spin"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                Deploying Survey…
              </>
            ) : (
              <>
                <span style={{ fontSize: '1rem' }}>ψ</span>
                Create Survey
              </>
            )}
          </button>

          {!isConnected && (
            <p className="text-xs text-center" style={{ color: '#8B8FA3' }}>
              Connect your wallet above to deploy this survey.
            </p>
          )}
        </div>
      </form>
    </div>
  );
};
