# 🌊 InvoiceStream: The Future of Invoice Financing

![Banner](demo-assets/system_logic.png)

### **Instant Cash Flow for SMEs. Real-Time Yield for Investors.**
**Built on Mantle Network & Superfluid**

---

## 🚀 The Problem
Small businesses (SMEs) are the backbone of the economy, yet they are strangled by cash flow gaps. Waiting **30, 60, or 90 days** to get paid for completed work is a silent killer. 
*   **Traditional Factoring is Broken:** High fees (15-30%), slow paper processes, and predatory terms.
*   **Lack of Access:** SMEs often can't access bank lines of credit easily.
*   **Frozen Capital:** Investors sit on capital that could be earning higher yields in real-world asset (RWA) markets.

## 💡 The Solution
**InvoiceStream** is a decentralized marketplace that turns stagnant invoices into liquid assets. 
*   **SMEs** tokenize invoices as NFTs and auction them for **instant cash**.
*   **Investors** bid on invoices to earn yield.
*   **Superfluid Streaming** handles repayment automatically, second-by-second, reducing default risk and providing continuous liquidity.

---

## 🔥 Key Features

### 1. **Invoice Tokenization (RWA)**
We convert real-world invoices into **ERC-721 NFTs**. This makes the debt obligation tradable, transparent, and completely verifiable on the Mantle blockchain.

### 2. **Competitive Bidding Auctions**
Instead of a fixed fee, investors compete to fund the invoice. This "Race to the Bottom" mechanism ensures the **SME always gets the best possible rate** (lowest cost of capital) determined by the free market.

### 3. **Programmable Money Streams**
Forget monthly payments. We use **Superfluid** to stream repayment from the SME back to the investor. 
*   **Risk Reduction:** Money moves constantly; issues are detected instantly.
*   **Real-Time Yield:** Investors see their balance grow every second.
*   **Capital Efficiency:** Returned funds can be re-deployed immediately.

### 4. **One-Click Experience**
*   **Privy Integration:** Seamless social login and embedded wallets. No complex seed phrases needed.
*   **Automated KYC/KYB:** tiered verification for compliance.
*   **Gasless Settlement:** Optimized smart contracts handle the heavy lifting.

---

## 🛠️ Technical Architecture

![Architecture](demo-assets/auction_timeline.png)

### **The Stack**
*   **Blockchain:** [Mantle Network (Sepolia Testnet)](https://www.mantle.xyz/) - For high-speed, low-cost execution.
*   **Streaming Engine:** [Superfluid](https://www.superfluid.finance/) - For real-time constant flow agreements (CFA).
*   **Authentication:** [Privy](https://www.privy.io/) - For seamless user onboarding.
*   **Frontend:** Next.js 14, TailwindCSS, Shadcn/UI.
*   **Smart Contracts:** Solidity, Hardhat.

### **How It Works (Under the Hood)**
1.  **Mint:** SME mints `InvoiceNFT`. Metadata (PDF hash, amount, due date) is stored on-chain.
2.  **Auction:** `InvoiceAuction` contract holds the NFT. Bids are placed in `$USDY` (Yield-bearing stablecoin).
3.  **Settlement:** 
    *   Winning bid is transferred to SME.
    *   SME wraps the funds (or future revenue) into Superfluid SuperTokens.
    *   `StreamingRepayment` contract opens a stream to the Investor.
4.  **Close:** Once the stream matches the invoice amount, the NFT is burned/marked paid.

---

## 🔗 Deployed Contracts (Mantle Sepolia)

| Contract | Address |
|----------|---------|
| **InvoiceNFT** | [`0x5AE9B42823982c09c082E6c0217d9A46a0b1D021`](https://sepolia.mantlescan.xyz/address/0x5AE9B42823982c09c082E6c0217d9A46a0b1D021) |
| **Auction** | [`0xA41d285af4c736220f1e317a7f3b53A396CD4b7E`](https://sepolia.mantlescan.xyz/address/0xA41d285af4c736220f1e317a7f3b53A396CD4b7E) |
| **Finance Manager**| [`0x1964150025024604A845F0f7b85814f6237F0f40`](https://sepolia.mantlescan.xyz/address/0x1964150025024604A845F0f7b85814f6237F0f40) |
| **Streaming** | [`0x1e1F4AAE6dC90c7AAD8aD9e2a5af7Ed3c9b2E9D2`](https://sepolia.mantlescan.xyz/address/0x1e1F4AAE6dC90c7AAD8aD9e2a5af7Ed3c9b2E9D2) |
| **KYC Bridge** | [`0x3fD1A28087c69D922ef6FEFAe231b9226EE9F7a7`](https://sepolia.mantlescan.xyz/address/0x3fD1A28087c69D922ef6FEFAe231b9226EE9F7a7) |
| **Mock USDY** | [`0xf5A8056C0957955A6Fe972c646e80475885939A2`](https://sepolia.mantlescan.xyz/address/0xf5A8056C0957955A6Fe972c646e80475885939A2) |

---

## 📸 Screenshots & Concepts

### **The Streaming Advantage**
![Streaming](demo-assets/streaming_concept.png)

---

## 🏃‍♂️ Getting Started

### Prerequisites
*   Node.js v18+
*   Mantle Testnet Funds ($MNT)

### Installation
```bash
# Clone the repo
git clone https://github.com/your-username/invoice-finance-mantle.git

# Install dependencies
npm install
cd frontend && npm install

# Run Frontend
npm run dev
```

### Testing Flows
1.  **Faucet USDY:** Go to `/profile` and perform Quick Setup.
2.  **Create Invoice:** Navigate to Invoices -> Create.
3.  **Place Bid:** Switch wallet/account -> Go to Auctions -> Bid.
4.  **Settle:** Wait for auction end -> Click Settle to start the stream.

---

## 👥 The Team
Built with ❤️ for the **Mantle & Superfluid Hackathon**.
*   **Shubham** - Full Stack Developer

---
*License: MIT*
