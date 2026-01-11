# Invoice Finance Streams - Deployment Addresses

This directory contains deployment information for different networks.

## File Format

Each deployment creates a JSON file named `{network}-{chainId}.json` with the following structure:

```json
{
  "network": "mantleSepolia",
  "chainId": 5003,
  "timestamp": "2026-01-01T...",
  "deployer": "0x...",
  "contracts": {
    "kycBridge": "0x...",
    "mockUSDY": "0x...",
    "invoiceNFT": "0x...",
    "invoiceAuction": "0x...",
    "streamingRepayment": "0x...",
    "invoiceFinanceManager": "0x..."
  },
  "superfluid": {
    "host": "0x4E583d9390082B65Bef884b629DFA426114CED6d",
    "cfaV1": "0x2844c1BBdA121E9E43105630b9C8310e5c72744b",
    "usdySuperToken": "0x..."
  }
}
```

## Usage

Frontend applications should import these addresses:

```typescript
import deployment from './deployments/mantleSepolia-5003.json';

const INVOICE_NFT_ADDRESS = deployment.contracts.invoiceNFT;
const AUCTION_ADDRESS = deployment.contracts.invoiceAuction;
// etc.
```

## Networks

- `mantleSepolia-5003.json` - Mantle Sepolia testnet
- `mantle-5000.json` - Mantle mainnet (when deployed)
