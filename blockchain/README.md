# 🇮🇳 Indian Carbon Credit Trading Scheme (CCTS) 🌳

A decentralized blockchain application built on **Ethereum (Sepolia Testnet)** to facilitate the Indian Carbon Credit Trading Scheme. This platform allows **Green Projects** to earn ICC tokens and **Organizations** to buy and retire them to meet mandatory compliance targets.

---

## 🛠 Prerequisites

- **Node.js**: v16.x or later
- **MetaMask**: Browser extension installed
- **Alchemy**: Account for Sepolia RPC access

---

## ⚙️ Initial Configuration

### 1. MetaMask Setup (4 Accounts)

To test the full lifecycle, create **4 distinct accounts** in MetaMask:

1. **Account 1: BEE Admin** (Deployer)
2. **Account 2: Accredited Auditor** (Hardcode this in `deploy.js`)
3. **Account 3: Organization** (The Buyer)
4. **Account 4: Green Project Owner** (The Seller)

---

### 2. Collect Fake Ether (Faucets)

You need Sepolia ETH to pay for transaction gas.

- **Google Search:** [Click here to search for "Sepolia Faucet"](https://www.google.com/search?q=sepolia+faucet)
- **Recommendation:** Use legit faucets like Google Cloud, Alchemy, or Infura
- **Note:** You will need a small amount of ETH on Mainnet for some faucets to work, or use a "PoW Faucet" that uses your CPU to "mine" test tokens

---

### 3. Auditor Authorization

Before deploying, you **must** authorize your Auditor:

1. Open `scripts/deploy.js`
2. Find the line: `const AUDITOR_ADDRESS = "0x...";`
3. Replace the address with your **Account 2** address

---

## 🔑 Environment Variables

Create these `.env` files to connect your backend and frontend.

### Root Directory `.env`

```env
ALCHEMY_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=YOUR_ACCOUNT_1_PRIVATE_KEY
```

### Frontend Directory `.env`

```env
REACT_APP_CONTRACT_ADDRESS=PASTE_ADDRESS_HERE
REACT_APP_SEPOLIA_CHAIN_ID=11155111
```

---

## 🚀 Deployment & ABI Setup

### Step 1: Deploy Contract

```bash
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```

---

### Step 2: Configure ABI

The frontend needs the contract's "map" to work:

1. Go to `artifacts/contracts/IndianCarbonCredit.sol/IndianCarbonCredit.json`
2. Copy the `abi` array
3. Open `frontend/src/contract.js` and paste it:

```javascript
export const abi = [
  /* Paste ABI array here */
];
```

---

### Step 3: Start Web App

```bash
cd frontend
npm install
npm start
```

---

## 🧪 Testing Flow

To test the system from end-to-end:

1. **Auditor (Account 2)**: Submits industry data (creates debt for Account 3) and forestry data (issues credits to Account 4)
2. **Organization (Account 3)**: Log in, view your "Non-Compliant" status, and post a "Buy Request" on the marketplace
3. **Green Project (Account 4)**: View the marketplace, find the request, and click "Fulfill" to transfer your credits
4. **Settlement (Account 3)**: Go to your dashboard and "Retire" the credits to become "Compliant"

---

## 📝 License

This project is licensed under the MIT License.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

---

## 📧 Contact

For questions or support, please reach out through the repository issues section.

---

**Built with ❤️ for a greener India 🌱**
