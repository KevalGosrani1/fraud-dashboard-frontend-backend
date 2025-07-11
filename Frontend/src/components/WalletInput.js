import { useState } from 'react';

export default function WalletInput({ onValid = () => {} }) {
  const [wallet, setWallet] = useState('');
  const [error, setError] = useState('');

  const isValidWallet = (input) => /^0x[a-fA-F0-9]{40}$/.test(input);

  const handleChange = (e) => {
    const val = e.target.value;
    setWallet(val);

    if (isValidWallet(val)) {
      setError('');
      onValid(val); // Safe because default function is provided
    } else {
      setError('Invalid wallet address (must start with 0x and be 42 characters)');
    }
  };

  return (
    <div className="p-4">
      <input
        type="text"
        value={wallet}
        onChange={handleChange}
        placeholder="Enter wallet address"
        className="w-full border p-2 rounded-md shadow-sm text-sm"
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
