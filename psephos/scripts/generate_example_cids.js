// Preview the exact seed metadata payloads and upload them through the local Next.js API.
// Useful for manual verification before running `npm run seed:basesepolia`.

const ENDPOINT = "http://localhost:3000/api/ipfs/survey-metadata";

const examples = [
  {
    name: "survey",
    payload: {
      version: 1,
      kind: "survey",
      question: "What would improve your Web3 onboarding experience?",
      description:
        "Share one concrete change that would make a Web3 product easier to understand, trust, or use.",
      responseMode: "open-text",
      allowBlankVote: false,
    },
  },
  {
    name: "poll",
    payload: {
      version: 1,
      kind: "poll",
      question: "Which Layer 2 do you use most often?",
      description: "Choose the Layer 2 you use most frequently right now.",
      options: [
        { id: "base", label: "Base" },
        { id: "arbitrum", label: "Arbitrum" },
        { id: "optimism", label: "Optimism" },
      ],
      responseMode: "single-choice",
      allowBlankVote: false,
    },
  },
  {
    name: "vote",
    payload: {
      version: 1,
      kind: "vote",
      question: "Which feature should Psephos prioritize next?",
      description: "Vote on the next product priority for the platform roadmap.",
      options: [
        { id: "private-responses", label: "Private responses" },
        { id: "token-gated-voting", label: "Token-gated voting" },
        { id: "creator-analytics", label: "Creator analytics" },
        { id: "blank-vote", label: "Blank Vote" },
      ],
      responseMode: "single-choice",
      allowBlankVote: true,
    },
  },
];

(async () => {
  for (const example of examples) {
    console.log(`\n=== ${example.name.toUpperCase()} PAYLOAD ===`);
    console.log(JSON.stringify(example.payload, null, 2));

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(example.payload),
      });

      const data = await response.json();

      if (response.ok && data.cid) {
        console.log(`${example.name} CID: ${data.cid}`);
      } else {
        console.error(`${example.name} ERROR:`, data);
      }
    } catch (error) {
      console.error(`${example.name} NETWORK ERROR:`, error.message);
    }
  }
})();
