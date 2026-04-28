# Week 7 Walkthrough: Upgradeable Vending Machine

We successfully implemented a **Transparent Proxy Pattern** to deploy and upgrade a Vending Machine contract.

## 🚀 Deployed Addresses (Sepolia)

| Contract Type | Address | Etherscan Link |
|---------------|---------|----------------|
| **Proxy (Main)** | `0x9D6ADB2a4524A036bd72b873C456cb8a0397D2AE` | [View on Etherscan](https://sepolia.etherscan.io/address/0x9D6ADB2a4524A036bd72b873C456cb8a0397D2AE) |
| **V1 Implementation** | `0x25fB07c5a49CC0A0dAD87c16e1E6A8280211A9e4` | [View Verified Code](https://sepolia.etherscan.io/address/0x25fB07c5a49CC0A0dAD87c16e1E6A8280211A9e4#code) |
| **V2 Implementation** | `0x827D9f94a0D37EBb8Ab3ea0029432d9fe7ecA2d5` | [View Verified Code](https://sepolia.etherscan.io/address/0x827D9f94a0D37EBb8Ab3ea0029432d9fe7ecA2d5#code) |

## ✅ Key Achievements
1.  **Iterative Development**: Deployed V1 with basic logic, then "patched" it with V2 to add ownership and withdrawal functions without changing the address.
2.  **State Preservation**: `numSodas` was set to 100 in V1 and remained at 100 after the upgrade to V2.
3.  **Transparency**: Verified source code on Etherscan so users can see exactly what logic the proxy is currently running.

## 🛠️ How to check in your browser
1. Go to the **Proxy Address** link above.
2. Select the **Contract** tab.
3. Click on **More Options** -> **Is this a proxy?** (if not already detected).
4. You can now use **Read as Proxy** to see `numSodas` and **Write as Proxy** to call `withdrawProfits`!
