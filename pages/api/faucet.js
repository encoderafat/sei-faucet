// pages/api/faucet.js
import { ethers } from 'ethers';

// Token configurations
const TOKENS = {
  METH: {
    address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    amount: ethers.parseEther('100') // 100 METH
  },
  MBTC: {
    address: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    amount: ethers.parseEther('2.5') // 2.5 MBTC
  },
  USDT: {
    address: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    amount: ethers.parseUnits('400000', 6) // 400000 USDT (assuming 6 decimals)
  }
};

// Simple ERC20 ABI for transfer function
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

// In-memory rate limiting (for simple testing)
// In production, use Redis or database
const rateLimitMap = new Map();

function checkRateLimit(address) {
  const today = new Date().toDateString();
  const key = `${address.toLowerCase()}_${today}`;
  const count = rateLimitMap.get(key) || 0;
  
  if (count >= 4) {
    return false;
  }
  
  rateLimitMap.set(key, count + 1);
  return true;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address, tokens } = req.body;

    // Validate input
    if (!address || !tokens || !Array.isArray(tokens)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    // Validate Ethereum address
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    // Check rate limit
    if (!checkRateLimit(address)) {
      return res.status(429).json({ 
        error: 'Daily limit exceeded. Maximum 4 distributions per day.' 
      });
    }

    // Validate requested tokens
    const invalidTokens = tokens.filter(token => !TOKENS[token]);
    if (invalidTokens.length > 0) {
      return res.status(400).json({ 
        error: `Invalid tokens: ${invalidTokens.join(', ')}` 
      });
    }

    // Initialize provider and wallet
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_SEI_RPC_URL);
    const wallet = new ethers.Wallet(process.env.NEXT_PUBLIC_FAUCET_PRIVATE_KEY, provider);

    const txHashes = [];

    // Send each requested token
    for (const tokenSymbol of tokens) {
      const tokenConfig = TOKENS[tokenSymbol];
      const tokenContract = new ethers.Contract(
        tokenConfig.address, 
        ERC20_ABI, 
        wallet
      );

      try {
        // Check faucet balance first
        const balance = await tokenContract.balanceOf(wallet.address);
        if (balance < tokenConfig.amount) {
          console.log(`Insufficient ${tokenSymbol} balance in faucet`);
          continue;
        }

        // Send tokens
        const tx = await tokenContract.transfer(address, tokenConfig.amount, {
          gasLimit: 100000 // Set reasonable gas limit
        });
        
        console.log(`Sent ${tokenSymbol} to ${address}, tx: ${tx.hash}`);
        txHashes.push({
          token: tokenSymbol,
          txHash: tx.hash,
          amount: ethers.formatUnits(tokenConfig.amount, 18) // Adjust decimals as needed
        });

      } catch (tokenError) {
        console.error(`Error sending ${tokenSymbol}:`, tokenError);
        // Continue with other tokens even if one fails
      }
    }

    if (txHashes.length === 0) {
      return res.status(500).json({ 
        error: 'Failed to send any tokens. Please try again later.' 
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully sent ${txHashes.map(t => t.token).join(', ')} to ${address}`,
      transactions: txHashes
    });

  } catch (error) {
    console.error('Faucet error:', error);
    res.status(500).json({ 
      error: 'Internal server error. Please try again later.' 
    });
  }
}

// Clean up old rate limit entries periodically (simple cleanup)
setInterval(() => {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
  for (const [key] of rateLimitMap) {
    if (key.endsWith(yesterday)) {
      rateLimitMap.delete(key);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour