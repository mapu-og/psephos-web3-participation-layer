import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import deploy from './deploy';
import Escrow from './Escrow';
import mapuImg from './assets/mapu.jpg';
import metamaskIcon from './assets/metamask.svg';
import phantomIcon from './assets/phantom.svg';
import coinbaseIcon from './assets/coinbase.svg';

const METAMASK_ICON = metamaskIcon;
const PHANTOM_ICON = phantomIcon;
const COINBASE_ICON = coinbaseIcon;

export async function approve(escrowContract, signer) {
  const approveTxn = await escrowContract.connect(signer).approve();
  await approveTxn.wait();
}

function App() {
  const [escrows, setEscrows] = useState([]);
  const [account, setAccount] = useState();
  const [signer, setSigner] = useState();
  const [balance, setBalance] = useState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [providerName, setProviderName] = useState("");

  // Input states
  const [arbiter, setArbiter] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("ETH"); // ETH or WEI
  const [ethPreview, setEthPreview] = useState("0");
  const [provider, setProvider] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // Background provider for fetching history even if wallet is disconnected
  const bgProvider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");

  const FACTORY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const FACTORY_ABI = [
    "function createEscrow(address _arbiter, address _beneficiary) external payable",
    "function getEscrows() external view returns (tuple(address escrowAddress, address arbiter, address beneficiary, address depositor, uint256 value)[])",
    "event EscrowCreated(address indexed escrowAddress, address indexed depositor, uint256 value)"
  ];

  // Poll transaction history independently
  useEffect(() => {
    async function fetchUpdate() {
      try {
        const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, bgProvider);
        const allEscrows = await factory.getEscrows();
        let allEvents = [];

        // 1. Get Deployment Events
        const createFilter = factory.filters.EscrowCreated();
        const createLogs = await factory.queryFilter(createFilter, 0);

        for (const log of createLogs) {
          const block = await log.getBlock();
          allEvents.push({
            hash: log.transactionHash,
            method: 'Deploy (💰)',
            from: log.args.depositor,
            to: log.args.escrowAddress,
            value: ethers.utils.formatEther(log.args.value),
            time: new Date(block.timestamp * 1000).toLocaleString(),
            timestamp: block.timestamp
          });
        }

        // 2. Get Verdict Events
        const escrowAbi = ["event Approved(uint256)"];
        await Promise.all(allEscrows.map(async (e) => {
          const escrowContract = new ethers.Contract(e.escrowAddress, escrowAbi, bgProvider);
          const approveFilter = escrowContract.filters.Approved();
          const approveLogs = await escrowContract.queryFilter(approveFilter, 0);

          for (const log of approveLogs) {
            const block = await log.getBlock();
            allEvents.push({
              hash: log.transactionHash,
              method: 'Verdict (⚖️)',
              from: e.arbiter,
              to: e.beneficiary,
              value: ethers.utils.formatEther(log.args[0]),
              time: new Date(block.timestamp * 1000).toLocaleString(),
              timestamp: block.timestamp
            });
          }
        }));

        setTransactions(allEvents.sort((a, b) => b.timestamp - a.timestamp));
      } catch (e) {
        console.error("History fetch failed", e);
      }
    }
    fetchUpdate();
    const interval = setInterval(fetchUpdate, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (amount && !isNaN(amount)) {
      try {
        if (unit === "WEI") {
          setEthPreview(ethers.utils.formatEther(amount));
        } else {
          setEthPreview(amount);
        }
      } catch (e) {
        setEthPreview("Invalid");
      }
    } else {
      setEthPreview("0");
    }
  }, [amount, unit]);

  useEffect(() => {
    const getMetaMaskProvider = () => {
      if (!window.ethereum) return null;
      if (window.ethereum.providers?.length) {
        return window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum.providers[0];
      }
      return window.ethereum;
    };

    const init = async () => {
      const eth = getMetaMaskProvider();
      if (eth) {
        const p = new ethers.providers.Web3Provider(eth);
        try {
          const accounts = await p.listAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setProvider(p);
            setSigner(p.getSigner());
          }
        } catch (e) {
          console.error("Init failed", e);
        }

        const handleAccounts = async (accounts) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            const newP = new ethers.providers.Web3Provider(eth);
            setProvider(newP);
            setSigner(newP.getSigner());
          } else {
            setAccount(null);
          }
        };

        if (eth.on) {
          eth.on('accountsChanged', handleAccounts);
          eth.on('chainChanged', () => window.location.reload());
        }

        return () => {
          if (eth.removeListener) {
            eth.removeListener('accountsChanged', handleAccounts);
          }
        };
      }
    };
    init();
  }, []);

  useEffect(() => {
    async function updateBalance() {
      if (account && provider) {
        try {
          const network = await provider.getNetwork();
          console.log("Detected Chain ID:", network.chainId);

          if (network.chainId !== 31337) {
            setBalance("Wrong Network");
            return;
          }

          const bal = await provider.getBalance(account);
          const formattedBal = ethers.utils.formatEther(bal);
          setBalance(formattedBal.includes('.') ? formattedBal.split('.')[0] + '.' + formattedBal.split('.')[1].slice(0, 2) : formattedBal);
        } catch (e) {
          console.error("Balance fetch error:", e);
        }
      }
    }
    updateBalance();
  }, [account, provider]);

  async function connectWallet(name) {
    setProviderName(name);
    setIsConnecting(true);
    try {
      let eth = window.ethereum;
      if (window.ethereum?.providers?.length) {
        if (name === "MetaMask") eth = window.ethereum.providers.find(p => p.isMetaMask);
        if (name === "Phantom") eth = window.ethereum.providers.find(p => p.isPhantom);
        if (name === "Coinbase") eth = window.ethereum.providers.find(p => p.isCoinbaseWallet);
      }
      if (!eth) eth = window.ethereum;

      const p = new ethers.providers.Web3Provider(eth);
      await p.send('eth_requestAccounts', []);
      const signer = p.getSigner();
      const address = await signer.getAddress();

      // SECURITY ADDITION: Mandatory Message Signing
      // This ensures the user actually has the private key and isn't just "spoofing" an address
      const message = `Welcome to Dictaminator!\n\nPlease sign this message to securely prove your identity.\n\nTimestamp: ${new Date().toLocaleString()}\nDomain: localhost:3000`;

      try {
        await signer.signMessage(message);

        setProvider(p);
        setSigner(signer);
        setAccount(address);
        setIsModalOpen(false);
      } catch (signErr) {
        console.error("Signature rejected", signErr);
        alert("Security verification failed: Signature rejected.");
      }
    } catch (e) {
      console.error(e);
      alert("Connection failed. Check if wallet is on Hardhat (31337).");
    }
    setIsConnecting(false);
  }

  const handlePaste = async (setter) => {
    try {
      const text = await navigator.clipboard.readText();
      setter(text);
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };



  // Function to create the handleApprove logic for a contract
  const createEscrowObject = (address, arbiter, beneficiary, value, signer, initialApproved = false) => {
    const abi = [
      "function approve() public",
      "function isApproved() public view returns (bool)",
      "event Approved(uint256)"
    ];
    const escrowContract = new ethers.Contract(address, abi, signer);

    return {
      address,
      arbiter,
      beneficiary,
      value: typeof value === 'string' ? value : ethers.utils.formatEther(value),
      isApproved: initialApproved,
      handleApprove: async () => {
        try {
          const tx = await escrowContract.approve();
          await tx.wait();

          const el = document.getElementById(address);
          if (el) {
            el.className = 'complete';
            el.innerText = "⚖️ Dictaminator Approved!";
          }
        } catch (e) {
          console.error("Approval failed", e);
          alert("Approval failed. Are you the Arbiter?");
        }
      },
    };
  };

  // Fetch escrows from Blockchain instead of localStorage
  useEffect(() => {
    async function fetchEscrows() {
      if (signer) {
        try {
          const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
          const allEscrows = await factory.getEscrows();

          const reattached = await Promise.all(allEscrows.map(async (e) => {
            // Check if already approved on-chain
            const escrowContract = new ethers.Contract(e.escrowAddress, ["function isApproved() public view returns (bool)"], signer);
            let approved = false;
            try {
              approved = await escrowContract.isApproved();
            } catch (err) {
              console.warn("Could not check isApproved for", e.escrowAddress);
            }

            return createEscrowObject(e.escrowAddress, e.arbiter, e.beneficiary, e.value, signer, approved);
          }));

          setEscrows(reattached.reverse()); // Newest first
        } catch (e) {
          console.error("Failed to fetch escrows from factory", e);
        }
      }
    }
    fetchEscrows();
  }, [signer]);

  async function newContract() {
    let valueInWei;
    try {
      if (unit === "ETH") {
        valueInWei = ethers.utils.parseEther(amount);
      } else {
        valueInWei = ethers.BigNumber.from(amount);
      }
    } catch (e) {
      alert("Invalid Amount - Please enter a number");
      return;
    }

    if (!arbiter || !beneficiary) {
      alert("Please fill in both addresses");
      return;
    }

    try {
      const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
      const tx = await factory.createEscrow(arbiter, beneficiary, { value: valueInWei });
      await tx.wait();

      // Refresh the list from the blockchain
      const allEscrows = await factory.getEscrows();
      const latest = allEscrows[allEscrows.length - 1];
      const newEscrow = createEscrowObject(latest.escrowAddress, latest.arbiter, latest.beneficiary, latest.value, signer);

      setEscrows(prev => [newEscrow, ...prev]);

      setAmount("");
      setArbiter("");
      setBeneficiary("");
    } catch (e) {
      console.error("Deployment failed", e);
      alert("Deployment failed. Check if wallet is connected and has funds.");
    }
  }

  async function switchNetwork() {
    try {
      const eth = window.ethereum.providers?.find(p => p.isMetaMask) || window.ethereum;
      await eth.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x7A69', // 31337 in hex
          chainName: 'Hardhat Local',
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['http://127.0.0.1:8545/'],
        }],
      });
    } catch (e) {
      console.error("Switch failed", e);
    }
  }

  function logout() {
    setAccount(null);
    setSigner(null);
    setBalance(null);
    setProvider(null);
  }

  const truncateAddress = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  return (
    <div className="app-container">
      <nav className="nav">
        <div className="logo-container">
          <img src={mapuImg} alt="Mapu" className="mapu-logo" />
          <div className="logo">Dictaminator <span style={{ fontSize: '14px', fontWeight: '400', opacity: 0.7 }}>by MapuriteLabs</span></div>
        </div>
        {!account ? (
          <button className="connect-btn" onClick={() => setIsModalOpen(true)}>
            Connect Wallet
          </button>
        ) : (
          <div className="profile-pill">
            <img src={mapuImg} alt="Profile" className="identicon-mapu" />
            <div className="profile-info" onClick={logout} title="Click to Logout" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <span className="address-text">{truncateAddress(account)}</span>
              {balance === "Wrong Network" ? (
                <button className="switch-net-btn" onClick={(e) => { e.stopPropagation(); switchNetwork(); }}>Switch to Hardhat</button>
              ) : (
                <span className="balance-text-pill">{balance} ETH</span>
              )}
              <span className="logout-icon">×</span>
            </div>
          </div>
        )}
      </nav>

      <div className="main-content">
        <div className="card">
          <h1>⚖️ New Dictaminator</h1>

          <div className="input-wrapper">
            <div className="label-row">
              <label>Dictaminator Address</label>
            </div>
            <div className="input-container">
              <input
                type="text"
                placeholder="Example: 0x3C44...93BC"
                value={arbiter}
                onChange={(e) => setArbiter(e.target.value)}
              />
              <button className="paste-btn" onClick={() => handlePaste(setArbiter)}>Paste</button>
            </div>
          </div>

          <div className="input-wrapper">
            <div className="label-row">
              <label>Beneficiary Address</label>
            </div>
            <div className="input-container">
              <input
                type="text"
                placeholder="Example: 0x7099...79c8"
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
              />
              <button className="paste-btn" onClick={() => handlePaste(setBeneficiary)}>Paste</button>
            </div>
          </div>

          <div className="input-wrapper">
            <div className="label-row">
              <label>Deposit Amount</label>
              <div className="unit-toggle">
                <button className={`unit-btn ${unit === 'ETH' ? 'active' : ''}`} onClick={() => setUnit('ETH')}>ETH</button>
                <button className={`unit-btn ${unit === 'WEI' ? 'active' : ''}`} onClick={() => setUnit('WEI')}>WEI</button>
              </div>
            </div>
            <div className="input-container">
              <input
                type="text"
                placeholder={unit === 'ETH' ? "Example: 1.5" : "Example: 1000000000000000000"}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            {unit === 'WEI' && <div className="eth-preview">≈ {ethPreview} ETH</div>}
          </div>

          <button className="action-btn" onClick={(e) => { e.preventDefault(); newContract(); }}>
            Deploy Dictaminator
          </button>
        </div>

        <div className="card">
          <h1>📜 Verdict History</h1>
          <div className="existing-contracts-grid">
            {escrows.length === 0 && <p style={{ color: '#64748b', textAlign: 'center', marginTop: '40px' }}>No verdicts pending.</p>}
            {escrows.map((escrow) => (
              <Escrow key={escrow.address} {...escrow} />
            ))}
          </div>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h1 style={{ margin: 0 }}>📜 Transaction History</h1>
            <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Local Network: 31337</span>
          </div>
          <div className="ledger-container" style={{ overflowX: 'auto' }}>
            <table className="ledger-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#64748b' }}>
                  <th style={{ padding: '12px 8px' }}>TX HASH</th>
                  <th style={{ padding: '12px 8px' }}>METHOD</th>
                  <th style={{ padding: '12px 8px' }}>FROM</th>
                  <th style={{ padding: '12px 8px' }}>TO (ID)</th>
                  <th style={{ padding: '12px 8px' }}>VALUE</th>
                  <th style={{ padding: '12px 8px' }}>TIME</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>Scanning blocks for transactions...</td></tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.hash} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s' }}>
                      <td style={{ padding: '12px 8px', color: '#38bdf8' }}>{truncateAddress(tx.hash)}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ background: 'rgba(244, 114, 182, 0.1)', color: '#f472b6', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>{tx.method}</span>
                      </td>
                      <td style={{ padding: '12px 8px', opacity: 0.8 }}>{truncateAddress(tx.from)}</td>
                      <td style={{ padding: '12px 8px', opacity: 0.8 }}>{truncateAddress(tx.to)}</td>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{tx.value} ETH</td>
                      <td style={{ padding: '12px 8px', color: '#64748b' }}>{tx.time}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="footer-content">
          <span className="footer-label">Built for safe commerce</span>
          <div className="footer-branding">
            By <span className="footer-name">MapuriteLabs</span>
          </div>
        </div>
      </footer>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => { setIsConnecting(false); setIsModalOpen(false); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => { setIsConnecting(false); setIsModalOpen(false); }}>&times;</button>
            {isConnecting ? (
              <>
                <h2>Waiting for Dictaminator...</h2>
                <div className="spinner"></div>
                <p>Please sign the entry in {providerName}</p>
                <button className="cancel-connect-btn" onClick={() => setIsConnecting(false)}>
                  Cancel Request
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src={mapuImg} alt="Mapu" style={{ width: '80px', borderRadius: '50%', marginBottom: '24px', border: '3px solid #f472b6', objectFit: 'cover' }} />
                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>Wallet Selection</h2>
                <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 24px 0' }}>Select your gateway</p>
                <div className="provider-list" style={{ width: '100%' }}>
                  <div className="provider-item" onClick={() => connectWallet("MetaMask")}>
                    <img className="provider-icon" src={METAMASK_ICON} alt="MetaMask" />
                    <span>MetaMask</span>
                  </div>
                  <div className="provider-item" onClick={() => connectWallet("Phantom")}>
                    <img className="provider-icon" src={PHANTOM_ICON} alt="Phantom" />
                    <span>Phantom</span>
                  </div>
                  <div className="provider-item" onClick={() => connectWallet("Coinbase")}>
                    <img className="provider-icon" src={COINBASE_ICON} alt="Coinbase" />
                    <span>Coinbase</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
