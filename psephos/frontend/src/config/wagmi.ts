import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { baseSepolia } from "wagmi/chains";

// A non-empty fallback prevents RainbowKit from throwing during static builds.
// Replace via NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in .env.local at runtime.
export const wagmiConfig = getDefaultConfig({
  appName: "SurveyPlatform",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ??
    "00000000000000000000000000000000",
  chains: [baseSepolia],
  ssr: true,
});
