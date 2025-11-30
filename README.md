<p align="center">
  <img src="public/logo.png" alt="Veridy Logo" width="120" />
</p>

<h1 align="center">Veridy</h1>

<p align="center">
  <strong>A Decentralized Data Marketplace with End-to-End Encryption</strong>
</p>

<p align="center">
  Buy and sell digital files securely using USDT on Arbitrum.<br/>
  Files are encrypted, stored on IPFS, and protected by smart contract escrow.
</p>

<p align="center">
  <strong>⚡ Powered by <a href="https://wallet.tether.io/">Tether WDK</a></strong>
</p>

---

## ✨ What is Veridy?

Veridy is a peer-to-peer marketplace where anyone can sell digital files - images, videos, documents, audio, 3D models, datasets, code, and more. Unlike traditional platforms, Veridy gives you:

- **True ownership** - Your wallet, your keys, your funds
- **Privacy** - Files are encrypted before upload; only buyers can decrypt
- **Security** - Payments are held in escrow until you receive access
- **Low fees** - Built on Arbitrum for fast, affordable transactions
- **Decentralization** - Files stored on IPFS, transactions on blockchain

---

## 🛒 How It Works

### For Sellers

1. **Connect Your Wallet** - Create a new wallet or import an existing one using your seed phrase
2. **Create a Listing** - Upload any file, set a title, description, category, and price in USDT
3. **Automatic Encryption** - Your file is encrypted with AES-256 before being uploaded to IPFS
4. **Manage Orders** - When someone purchases, review the order and approve to release the decryption key
5. **Get Paid** - USDT is released from escrow directly to your wallet

### For Buyers

1. **Browse the Marketplace** - Explore listings across categories like Images, Videos, Documents, Audio, 3D Models, Datasets, and Code
2. **Purchase with USDT** - Pay securely; your funds are held in smart contract escrow
3. **Wait for Approval** - The seller reviews and approves your purchase
4. **Download & Decrypt** - Once approved, download and decrypt the file directly in your browser
5. **Cancel Anytime** - If the seller doesn't approve, you can cancel and get refunded

---

## 🔐 Security Features

### End-to-End Encryption
- Files are encrypted with **AES-256-GCM** before leaving your device
- Encryption keys are exchanged securely using **ECDH (Elliptic Curve Diffie-Hellman)**
- Only the buyer who purchases can decrypt the file - not even Veridy can access it

### Smart Contract Escrow
- All payments are held in a secure smart contract
- Funds are only released when the seller provides the decryption key
- Buyers can cancel and get refunded if the seller doesn't respond

### Content Verification
- Files are hashed (SHA-256) before encryption
- Buyers can verify file integrity after decryption
- Ensures you receive exactly what was listed

### Self-Custodial Wallet
- Generate a new wallet or import your existing one
- 12-word seed phrase gives you complete control
- Private keys never leave your device

---

## 📁 Supported File Types

| Category | File Types |
|----------|------------|
| 🖼️ **Images** | JPG, PNG, GIF, WebP, SVG, BMP |
| 🎥 **Videos** | MP4, MOV, AVI, WebM, MKV |
| 📄 **Documents** | PDF, DOC, DOCX, TXT, Markdown |
| 🎵 **Audio** | MP3, WAV, OGG, FLAC, AAC |
| 🗿 **3D Models** | GLB, GLTF, OBJ, FBX, STL |
| 📊 **Datasets** | CSV, JSON, XML, Parquet |
| 💻 **Code** | JS, TS, Python, Rust, Go, Solidity, ZIP |
| 📦 **Other** | Any file type |

---

## 💰 Payments

- **Currency**: USDT (Tether) stablecoin
- **Network**: Arbitrum (mainnet) or Sepolia (testnet)
- **Fees**: Low Arbitrum transaction fees (~$0.01-0.10)
- **Escrow**: Smart contract holds funds until transaction completes

### Wallet Features
- View your USDT balance in real-time
- Send USDT to any address
- Track transaction history
- Self-custodial - your keys, your coins

---

## 🚀 Getting Started

### 1. Create or Import a Wallet

When you first visit Veridy, you'll be prompted to set up a wallet:

- **Create New Wallet** - Generates a secure 12-word seed phrase. **Write it down and store it safely!** This is the only way to recover your wallet.
- **Import Wallet** - Enter your existing seed phrase to restore access

### 2. Fund Your Wallet

To purchase files or pay for transaction fees:
- Send USDT to your Veridy wallet address on Arbitrum
- You'll also need a small amount of ETH on Arbitrum for gas fees

### 3. Start Trading

- **Browse** the marketplace to find files
- **Create** listings to sell your own files
- **Manage** your orders and purchases from the dashboard

---

## 📱 Dashboard Sections

| Section | Description |
|---------|-------------|
| **Marketplace** | Browse all active listings, filter by category |
| **Create** | Upload and list a new file for sale |
| **My Listings** | View and manage your listed files |
| **Orders** | Incoming purchase requests (sellers) + your purchase status (buyers) |
| **Purchases** | Download files you've purchased |
| **Wallet** | View balance, send USDT, transaction history |

---

## ⚙️ Technical Details

### Tether WDK
Wallet management and USDT operations are powered by [Tether WDK](https://wallet.tether.io/) - handles wallet creation, imports, transfers, and balance queries.

### Networks
- **Arbitrum** (Production) - Fast, low-cost Ethereum L2
- **Sepolia** (Testing) - Use for testing with mock USDT

### Smart Contract
Veridy uses a decentralized smart contract for:
- Listing management (create, update, deactivate)
- Escrow payments (hold, release, refund)
- Purchase tracking and status

### Storage
- Encrypted files are stored on **IPFS** via Pinata
- Only the encrypted version is stored - original files stay private
- IPFS CID ensures content integrity and availability

### Encryption Flow
```
Seller uploads → Generate AES key → Encrypt file → Upload to IPFS → List on-chain

Buyer purchases → ECDH key exchange → Seller encrypts AES key for buyer → 
Store on-chain → Buyer decrypts key → Download from IPFS → Decrypt file
```

---

## ❓ FAQ

**Q: What happens if the seller never approves my purchase?**
> You can cancel your purchase at any time and receive a full refund.

**Q: Can Veridy access my files?**
> No. Files are encrypted before upload using keys only you and your buyer have access to.

**Q: What if I lose my seed phrase?**
> Unfortunately, without your seed phrase, you cannot recover your wallet or funds. Always store it securely.

**Q: Are there any fees?**
> Veridy itself is free to use. You only pay Arbitrum network fees (~$0.01-0.10 per transaction).

**Q: Can I list the same file multiple times?**
> Yes, you can create multiple listings. Each listing can be purchased by different buyers.

---

## 🛠️ Development

### Tech Stack
- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Wallet**: Tether WDK (`@tetherto/wdk`, `@tetherto/wdk-wallet-evm`)
- **Blockchain**: Viem, Arbitrum
- **Storage**: IPFS (Pinata)
- **State**: Zustand

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Add your Pinata JWT token

# Run development server
npm run dev
```

### Environment Variables
```
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_token
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud
INDEXER_API_KEY=tether_wdk_indexer_api_key
```

### Build
```bash
npm run build
npm run start
```

---

## 🔗 Links

- **Smart Contract (Arbitrum)**: `0xD3A17B869883EAec005620D84B38E68d3c6cF893`
- **USDT (Arbitrum)**: `0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9`

---

<p align="center">
  <strong>Trade digital files securely. Own your data.</strong><br/>
  <em>Powered by Tether WDK & Arbitrum</em>
</p>
