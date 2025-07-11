import { useState } from 'react';
import { reportsApi } from '../api/fraudApi'; // Make sure this import path is correct
import { format } from 'date-fns';
const formatted = format(nextTime, 'PPpp');

export default function ReportForm({ session }) {
  const [wallet, setWallet] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  const isValidWallet = (input) => /^0x[a-fA-F0-9]{40}$/.test(input);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidWallet(wallet)) {
      setMessage('Invalid wallet address.');
      return;
    }

    try {
      const { status, data } = await reportsApi.submitReport({
        wallet,
        reason
      });

      if (status === 200 || status === 201) {
        setMessage('✅ Report submitted successfully!');
        setWallet('');
        setReason('');
      } else if (status === 429 && data.nextAvailableAt) {
        const nextTime = new Date(data.nextAvailableAt);
        
        setMessage(
          `❌ Rate limit exceeded. You can submit again on ${formatted}.`
        );
      } else {
        setMessage(data.error || '❌ Failed to submit report.');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      setMessage('⚠️ Something went wrong.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-4">
      <label className="block mb-2 font-medium">Wallet Address</label>
      <input
        type="text"
        value={wallet}
        onChange={(e) => setWallet(e.target.value)}
        className="w-full p-2 border rounded"
        placeholder="Enter wallet address"
      />

      <label className="block mt-4 mb-2 font-medium">
        Why do you think this wallet is suspicious?
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full p-2 border rounded"
        placeholder="Describe the suspicious activity..."
        rows={4}
      />

      <button
        type="submit"
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Submit Report
      </button>

      {message && (
        <p
          className={`mt-4 text-sm ${
            message.startsWith('✅')
              ? 'text-green-600'
              : 'text-red-600'
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
