import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
// Farcaster Mini App SDK placeholder (replace with actual import)
const MiniSDK = {
  getCurrentUser: async () => ({ user: { fid: '0x1234', displayName: 'Satoshi' }, isSignedIn: true }),
  getEthereumProvider: async () => window.ethereum,
  shareCast: async (message) => console.log('Cast shared:', message),
};

export default function FarcasterNFTApp() {
  const [user, setUser] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [ipfsURL, setIpfsURL] = useState('');
  const [minting, setMinting] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [log, setLog] = useState([]);

  useEffect(() => {
    (async () => {
      const { user: u, isSignedIn } = await MiniSDK.getCurrentUser();
      if (isSignedIn) setUser(u);
    })();
  }, []);

  const addLog = (msg) => setLog((l) => [...l, msg]);

  // Placeholder IPFS upload (replace with NFT.Storage or Pinata)
  const uploadToIPFS = async (file) => {
    addLog('Uploading file to IPFS...');
    const fakeCID = 'QmFakeIPFSHash';
    setIpfsURL(`ipfs://${fakeCID}`);
    addLog(`File uploaded to IPFS: ${fakeCID}`);
    return `ipfs://${fakeCID}`;
  };

  const handleMint = async () => {
    if (!imageFile) {
      alert('Please select an image!');
      return;
    }
    setMinting(true);
    try {
      const metadataURI = await uploadToIPFS(imageFile);
      const provider = new ethers.BrowserProvider(await MiniSDK.getEthereumProvider());
      const signer = await provider.getSigner();

      const contractAddress = '0x03c4738ee98ae44591e1a4a4f3cab6641d95dd9a'; // Base mainnet ERC721
      const abi = ['function safeMint(address to, string memory uri) public returns (uint256)'];
      const nftContract = new ethers.Contract(contractAddress, abi, signer);

      addLog('Sending mint transaction...');
      const tx = await nftContract.safeMint(await signer.getAddress(), metadataURI);
      addLog('Waiting for confirmation...');
      const receipt = await tx.wait();
      setTxHash(receipt.transactionHash);
      addLog(`NFT minted! Tx: ${receipt.transactionHash}`);

      // Farcaster cast
      await MiniSDK.shareCast(`I just minted an NFT on Base! 🎨 Tx: ${receipt.transactionHash}`);
      addLog('Shared cast on Farcaster');
    } catch (err) {
      addLog('Mint failed: ' + err.message);
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <header className="max-w-3xl mx-auto mb-6">
        <h1 className="text-2xl font-semibold">Farcaster Base NFT Mint</h1>
        <div className="text-sm text-slate-600">{user ? `Signed in as ${user.displayName}` : 'Not signed in'}</div>
      </header>

      <main className="max-w-3xl mx-auto space-y-6 bg-white rounded-2xl p-4 shadow-sm">
        <section>
          <h2 className="text-lg font-medium mb-2">Select Image to Mint</h2>
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
          {imageFile && <div className="mt-2">Selected: {imageFile.name}</div>}
        </section>

        <section>
          <button
            onClick={handleMint}
            disabled={minting}
            className="px-4 py-2 rounded-2xl border bg-blue-500 text-white hover:bg-blue-600"
          >
            {minting ? 'Minting...' : 'Mint NFT on Base'}
          </button>
        </section>

        {txHash && (
          <section>
            <h2 className="text-lg font-medium">Transaction Completed</h2>
            <a
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              View on BaseScan
            </a>
          </section>
        )}

        <section>
          <h2 className="text-lg font-medium mb-2">Activity Log</h2>
          <div className="text-xs text-slate-500 max-h-40 overflow-y-auto">
            <ul className="space-y-1">{log.slice().reverse().map((l, i) => (<li key={i}>• {l}</li>))}</ul>
          </div>
        </section>
      </main>
    </div>
  );
}
