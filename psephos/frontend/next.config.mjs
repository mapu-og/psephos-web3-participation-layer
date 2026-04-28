import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    IPFS_GATEWAY_BASE_URL:
      process.env.IPFS_GATEWAY_BASE_URL || "https://gateway.pinata.cloud/ipfs",
  },
  webpack: (config) => {
    // Stub React Native module imported transitively by MetaMask SDK
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": path.resolve(
        __dirname,
        "src/stubs/async-storage.js"
      ),
    };
    // Required for wagmi/viem packages that reference native node modules
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
