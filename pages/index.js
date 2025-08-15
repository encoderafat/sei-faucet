import React, { useState, useEffect } from 'react';
import { AlertCircle, Droplets, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function TokenFaucet() {
  const [address, setAddress] = useState('');
  const [selectedTokens, setSelectedTokens] = useState(['METH', 'MBTC', 'USDT']); // Default to all tokens selected
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [distributionHistory, setDistributionHistory] = useState([]);

  const tokens = [
    { symbol: 'METH', address: '0x5FbDB2315678afecb367f032d93F642f64180aa3', amount: '100' },
    { symbol: 'MBTC', address: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', amount: '2.5' },
    { symbol: 'USDT', address: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', amount: '400000' }
  ];

  // Mock function to check rate limits (in real implementation, this would call your backend)
  const checkRateLimit = (userAddress) => {
    const today = new Date().toDateString();
    const userHistory = distributionHistory.filter(
      h => h.address.toLowerCase() === userAddress.toLowerCase() && h.date === today
    );
    return userHistory.length < 4;
  };

  // Real function to distribute tokens via API
  const distributeTokens = async () => {
    if (!address || selectedTokens.length === 0) {
      setMessage('Please enter an address and select at least one token.');
      setMessageType('error');
      return;
    }

    // Basic address validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setMessage('Please enter a valid Ethereum address.');
      setMessageType('error');
      return;
    }

    // Check rate limit
    if (!checkRateLimit(address)) {
      setMessage('You have reached the daily limit of 4 token distributions. Please try again tomorrow.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/faucet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: address,
          tokens: selectedTokens
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to distribute tokens');
      }

      // Add to distribution history
      const newDistribution = {
        address: address,
        tokens: selectedTokens,
        date: new Date().toDateString(),
        timestamp: new Date().toLocaleTimeString(),
        txHashes: data.transactions.map(tx => tx.txHash)
      };

      setDistributionHistory(prev => [...prev, newDistribution]);
      
      setMessage(data.message);
      setMessageType('success');
      
      // Reset form
      setAddress('');
      setSelectedTokens([]);
      
    } catch (error) {
      setMessage(error.message || 'Failed to distribute tokens. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSelection = (tokenSymbol) => {
    setSelectedTokens(prev => {
      if (prev.includes(tokenSymbol)) {
        return prev.filter(t => t !== tokenSymbol);
      } else {
        return [...prev, tokenSymbol];
      }
    });
  };

  const getRemainingDistributions = () => {
    const today = new Date().toDateString();
    const todayDistributions = distributionHistory.filter(
      h => h.address.toLowerCase() === address.toLowerCase() && h.date === today
    ).length;
    return Math.max(0, 4 - todayDistributions);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="glass-panel rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Droplets className="h-12 w-12 text-orange-500 mr-3" />
              <h1 className="text-3xl font-bold text-gray-800">SEI EVM Testnet Faucet</h1>
            </div>
            <p className="text-gray-600">Get testnet tokens for development on SEI EVM</p>
          </div>

          <div className="space-y-6">
            {/* Address Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Wallet Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x742d35Cc6634C0532925a3b8D45C3db2C1B876e9"
                className="input-field"
              />
            </div>

            {/* Token Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Select Tokens (Max 4 per day)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {tokens.map((token) => (
                  <div
                    key={token.symbol}
                    onClick={() => handleTokenSelection(token.symbol)}
                    className={`token-card ${
                      selectedTokens.includes(token.symbol)
                        ? 'token-card-selected'
                        : 'token-card-unselected'
                    }`}
                  >
                    <div className="text-gray-800 font-semibold">{token.symbol}</div>
                    <div className="text-gray-600 text-sm">{token.amount} tokens</div>
                    <div className="text-gray-500 text-xs mt-1 truncate">
                      {token.address}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rate Limit Info */}
            {address && (
              <div className="alert-warning rounded-lg p-3">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span className="text-sm">
                    Remaining distributions today: {getRemainingDistributions()}/4
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={distributeTokens}
              disabled={loading || !address || selectedTokens.length === 0}
              className="btn-primary w-full flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="loading-spinner rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Distributing Tokens...
                </>
              ) : (
                <>
                  <Droplets className="h-5 w-5 mr-2" />
                  Request Tokens
                </>
              )}
            </button>

            {/* Message Display */}
            {message && (
              <div className={`p-4 rounded-lg flex items-center ${
                messageType === 'success' 
                  ? 'alert-success'
                  : 'alert-error'
              }`}>
                {messageType === 'success' ? (
                  <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                )}
                <span className="text-sm">{message}</span>
              </div>
            )}

            {/* Info Panel */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-orange-600" />
                <div className="text-sm">
                  <div className="font-semibold text-gray-800 mb-1">Important Notes:</div>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Maximum 4 token distributions per address per day</li>
                    <li>• Tokens are sent directly to your address</li>
                    <li>• No transaction fees required from your end</li>
                    <li>• Only for SEI EVM testnet development</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Distributions */}
        {distributionHistory.length > 0 && (
          <div className="mt-8 glass-panel rounded-2xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Distributions</h3>
            <div className="space-y-3">
              {distributionHistory.slice(-5).reverse().map((dist, index) => (
                <div key={index} className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                  <div className="text-gray-800 font-medium">{dist.tokens.join(', ')}</div>
                  <div className="text-gray-600 text-sm">To: {dist.address}</div>
                  <div className="text-gray-500 text-xs">{dist.date} at {dist.timestamp}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}