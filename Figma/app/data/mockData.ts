export interface Survey {
  id: string;
  title: string;
  ipfsHash: string;
  rewardPerResponse: number; // ETH
  maxResponses: number;
  currentResponses: number;
  deadline: string; // YYYY-MM-DD
  creator: string; // wallet address
  balance: number; // ETH remaining
  status: 'active' | 'closed' | 'expired';
  description: string;
}

export const mockSurveys: Survey[] = [
  {
    id: '1',
    title: 'DeFi Protocol Satisfaction Survey',
    ipfsHash: 'QmX7Y8Z9AbCdEfGhIjKlMnOpQrStUvWxYz12345678Ab',
    rewardPerResponse: 0.005,
    maxResponses: 100,
    currentResponses: 67,
    deadline: '2026-05-15',
    creator: '0x742d35Cc6634C0532925a3b8D4C9E5a8b1f2e3d4',
    balance: 0.165,
    status: 'active',
    description:
      'Help us improve DeFi protocols by sharing your experience with current yield farming and liquidity provision strategies.',
  },
  {
    id: '2',
    title: 'DAO Governance Preferences Study',
    ipfsHash: 'QmA1B2C3D4E5F6G7H8I9J0KaBbCcDdEeFfGgHhIiJj12',
    rewardPerResponse: 0.008,
    maxResponses: 50,
    currentResponses: 23,
    deadline: '2026-05-28',
    creator: '0x9f8E7D6C5B4A3928F7E6D5C4B3A2918F7E6D5C4B',
    balance: 0.216,
    status: 'active',
    description:
      'Research into decentralized autonomous organization voting mechanisms and governance token distribution models.',
  },
  {
    id: '3',
    title: 'NFT Marketplace UX Research',
    ipfsHash: 'QmL9M8N7O6P5Q4R3S2T1U0VaWbXcYdZeAfBgChDiEjFk',
    rewardPerResponse: 0.003,
    maxResponses: 30,
    currentResponses: 28,
    deadline: '2026-04-25',
    creator: '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B',
    balance: 0.006,
    status: 'active',
    description:
      'Understanding user experience challenges in NFT marketplaces to improve the buying, selling, and discovery process.',
  },
  {
    id: '4',
    title: 'Layer 2 Scaling Solutions Survey',
    ipfsHash: 'QmR4S5T6U7V8W9X0Y1Z2AaBbCcDdEeFfGgHhIiJjKk34',
    rewardPerResponse: 0.01,
    maxResponses: 200,
    currentResponses: 45,
    deadline: '2026-06-10',
    creator: '0x5F4E3D2C1B0A9F8E7D6C5B4A3928F7E6D5C4B3A2',
    balance: 1.55,
    status: 'active',
    description:
      'Comprehensive study on user preferences and experiences with Ethereum Layer 2 scaling solutions including Optimism, Arbitrum, and Base.',
  },
  {
    id: '5',
    title: 'Web3 Onboarding Experience',
    ipfsHash: 'QmM1N2O3P4Q5R6S7T8U9V0WaXbYcZdAeBfCgDhEiFjGk',
    rewardPerResponse: 0.006,
    maxResponses: 75,
    currentResponses: 3,
    deadline: '2026-07-01',
    creator: '0x3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D',
    balance: 0.432,
    status: 'active',
    description:
      'Share your Web3 onboarding journey and help make crypto more accessible to the next billion users.',
  },
  {
    id: '6',
    title: 'Cross-chain Bridge Security Audit',
    ipfsHash: 'QmZ9Y8X7W6V5U4T3S2R1Q0PaObNcMdLeLfKgJhIiHjGk',
    rewardPerResponse: 0.015,
    maxResponses: 40,
    currentResponses: 40,
    deadline: '2026-04-10',
    creator: '0x7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F',
    balance: 0,
    status: 'closed',
    description:
      'Security research survey on cross-chain bridge vulnerabilities. Responses closed — thank you to all participants.',
  },
];

// Utility helpers
export const truncateHash = (hash: string, front = 8, back = 6) =>
  hash.length > front + back + 3
    ? `${hash.slice(0, front)}...${hash.slice(-back)}`
    : hash;

export const truncateAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

export const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const generateTxHash = () =>
  '0x' +
  Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
