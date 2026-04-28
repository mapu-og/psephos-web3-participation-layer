// Script utilitario para subir metadata de ejemplo a IPFS vía el endpoint local de Next.js
// Ejecuta este script ANTES de correr seed.ts y reemplaza los CIDs en seed.ts con los que imprime este script

const fetch = require('node-fetch');
const fs = require('fs');

const ENDPOINT = 'http://localhost:3000/api/ipfs/survey-metadata';

const examples = [
  {
    name: 'survey',
    payload: {
      version: 1,
      kind: 'survey',
      question: "What's your favorite L2?",
      description: "Share your favorite Layer 2 scaling solution.",
      responseMode: 'open-text',
      allowBlankVote: false,
    },
  },
  {
    name: 'poll',
    payload: {
      version: 1,
      kind: 'poll',
      question: 'DeFi vs CeFi - Your take?',
      description: 'Choose your preferred financial system.',
      options: [
        { id: 'defi', label: 'DeFi' },
        { id: 'cefi', label: 'CeFi' },
      ],
      responseMode: 'single-choice',
      allowBlankVote: false,
    },
  },
  {
    name: 'vote',
    payload: {
      version: 1,
      kind: 'vote',
      question: 'Rate your Web3 experience',
      description: 'How would you rate your experience with Web3?',
      options: [
        { id: 'good', label: 'Good' },
        { id: 'average', label: 'Average' },
        { id: 'bad', label: 'Bad' },
      ],
      responseMode: 'single-choice',
      allowBlankVote: true,
    },
  },
];

(async () => {
  for (const ex of examples) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ex.payload),
    });
    const data = await res.json();
    if (data.cid) {
      console.log(`${ex.name} CID:`, data.cid);
    } else {
      console.error(`${ex.name} ERROR:`, data);
    }
  }
})();
