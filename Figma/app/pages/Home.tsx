import { Link } from 'react-router';
import { ArrowRight, Clock, Users, Hash, Coins, PlusCircle } from 'lucide-react';
import { mockSurveys, truncateHash, formatDate } from '../data/mockData';
import type { Survey } from '../data/mockData';

const StatusBadge = ({ status }: { status: Survey['status'] }) => {
  const label = status === 'active' ? 'Active' : status === 'closed' ? 'Closed' : 'Expired';
  const cls = `badge-${status}`;
  return (
    <span
      className={`${cls} text-xs font-medium px-2.5 py-1 rounded-full`}
      style={{ letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.65rem' }}
    >
      {label}
    </span>
  );
};

const SurveyCard = ({ survey }: { survey: Survey }) => {
  const progress = Math.min((survey.currentResponses / survey.maxResponses) * 100, 100);
  const remaining = survey.maxResponses - survey.currentResponses;
  const isFull = remaining <= 0;

  return (
    <div className="psephos-card p-0 flex flex-col overflow-hidden">
      {/* Cyan accent top bar */}
      <div
        style={{
          height: '3px',
          background: survey.status === 'active'
            ? 'linear-gradient(90deg, #00E5CC, rgba(0,229,204,0.3))'
            : 'linear-gradient(90deg, #2A2D3A, #2A2D3A)',
        }}
      />

      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Header row: status + deadline */}
        <div className="flex items-start justify-between gap-2">
          <StatusBadge status={survey.status} />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Clock size={11} style={{ color: '#8B8FA3' }} />
            <span className="text-xs" style={{ color: '#8B8FA3' }}>
              {formatDate(survey.deadline)}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3
          className="leading-snug"
          style={{ color: '#F5F6FA', fontSize: '0.95rem', fontWeight: 600 }}
        >
          {survey.title}
        </h3>

        {/* IPFS hash */}
        <div className="flex items-center gap-2">
          <Hash size={12} style={{ color: '#8B8FA3' }} />
          <span
            style={{
              color: '#8B8FA3',
              fontSize: '0.72rem',
              fontFamily: 'monospace',
              letterSpacing: '0.02em',
            }}
          >
            {truncateHash(survey.ipfsHash)}
          </span>
        </div>

        {/* Reward */}
        <div className="flex items-center gap-2">
          <Coins size={13} style={{ color: '#00E5CC' }} />
          <span style={{ color: '#F5F6FA', fontSize: '0.85rem', fontWeight: 500 }}>
            {survey.rewardPerResponse.toFixed(3)} ETH
          </span>
          <span style={{ color: '#8B8FA3', fontSize: '0.75rem' }}>/ response</span>
        </div>

        {/* Progress bar + response count */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Users size={12} style={{ color: '#8B8FA3' }} />
              <span style={{ color: '#F5F6FA', fontSize: '0.8rem', fontWeight: 500 }}>
                {survey.currentResponses}
                <span style={{ color: '#8B8FA3' }}>/{survey.maxResponses}</span>
              </span>
            </div>
            <span style={{ color: isFull ? '#E54D4D' : '#8B8FA3', fontSize: '0.75rem' }}>
              {isFull ? 'Full' : `${remaining} slots left`}
            </span>
          </div>
          <div className="progress-track" style={{ height: '5px' }}>
            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
                background: isFull ? '#E54D4D' : '#00E5CC',
                boxShadow: isFull ? '0 0 6px rgba(229,77,77,0.5)' : '0 0 8px rgba(0,229,204,0.4)',
              }}
            />
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* View button */}
        <Link
          to={`/survey/${survey.id}`}
          style={{ textDecoration: 'none' }}
        >
          <button
            className="btn-view w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium"
          >
            View Survey
            <ArrowRight size={14} />
          </button>
        </Link>
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="col-span-full flex flex-col items-center justify-center py-24 gap-6">
    <div
      className="w-20 h-20 rounded-full flex items-center justify-center"
      style={{ background: 'rgba(0,229,204,0.06)', border: '1px solid rgba(0,229,204,0.15)' }}
    >
      <span
        style={{
          color: '#00E5CC',
          fontSize: '2.2rem',
          textShadow: '0 0 12px rgba(0,229,204,0.5)',
        }}
      >
        ψ
      </span>
    </div>
    <div className="text-center max-w-xs">
      <p
        className="mb-1"
        style={{ color: '#F5F6FA', fontSize: '1rem', fontWeight: 600 }}
      >
        No active surveys yet.
      </p>
      <p className="text-sm" style={{ color: '#8B8FA3' }}>
        Create one to start collecting on-chain responses.
      </p>
    </div>
    <Link to="/create" style={{ textDecoration: 'none' }}>
      <button className="btn-primary flex items-center gap-2 px-6 py-3 text-sm font-semibold">
        <PlusCircle size={16} />
        Create Survey
      </button>
    </Link>
  </div>
);

export const Home = () => {
  const activeSurveys = mockSurveys;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page heading */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1
            className="mb-1"
            style={{ color: '#F5F6FA', fontSize: '1.6rem', fontWeight: 700 }}
          >
            Active Surveys
          </h1>
          <p style={{ color: '#8B8FA3', fontSize: '0.875rem' }}>
            Earn ETH by contributing verified responses on-chain
          </p>
        </div>
        <Link to="/create" style={{ textDecoration: 'none' }}>
          <button className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm font-semibold whitespace-nowrap">
            <PlusCircle size={15} />
            Create Survey
          </button>
        </Link>
      </div>

      {/* Stats strip */}
      <div
        className="grid grid-cols-3 gap-4 mb-10 p-4 rounded-xl"
        style={{ background: '#1A1D27', border: '1px solid #2A2D3A' }}
      >
        {[
          {
            label: 'Total Surveys',
            value: mockSurveys.length,
            color: '#00E5CC',
          },
          {
            label: 'Active',
            value: mockSurveys.filter((s) => s.status === 'active').length,
            color: '#00E5CC',
          },
          {
            label: 'Responses Collected',
            value: mockSurveys.reduce((acc, s) => acc + s.currentResponses, 0),
            color: '#F5F6FA',
          },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <p
              className="font-bold"
              style={{ color: stat.color, fontSize: '1.4rem' }}
            >
              {stat.value}
            </p>
            <p className="text-xs" style={{ color: '#8B8FA3' }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Survey grid */}
      {activeSurveys.length === 0 ? (
        <div className="grid">
          <EmptyState />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeSurveys.map((survey) => (
            <SurveyCard key={survey.id} survey={survey} />
          ))}
        </div>
      )}
    </div>
  );
};
