// 🔧 Constants
const BLOCK_INTERVAL = 13 * 60 * 1000; // 13 minutes in ms
const MINT_AMOUNT = 23.0;
const TOTAL_SUPPLY = 13000000.0;
const GENESIS_LOCK = 1300000.0;
const AVAILABLE_SUPPLY = TOTAL_SUPPLY - GENESIS_LOCK;

let miningLoop = null;
let miningActive = false;

// 🪪 Wallet Functions
function generateWalletAddress() {
  const entropy = crypto.randomUUID().replace(/-/g, '');
  return 'WALLET_' + entropy.slice(0, 12);
}

function createWallet() {
  const address = generateWalletAddress();
  const wallet = {
    address,
    balance: 0.0,
    last_mined: null
  };
  localStorage.setItem(address, JSON.stringify(wallet));
  localStorage.setItem('active_wallet', address);
  document.getElementById('wallet-info').innerText = `🆕 Created Wallet: ${address}`;
  showActions();
}

function loadWallet() {
  const choice = prompt("🔐 Enter wallet ID:");
  if (!choice) {
    alert('⚠️ No wallet ID entered.');
    return;
  }

  const wallet = JSON.parse(localStorage.getItem(choice));
  if (!wallet) {
    alert('❌ Wallet not found.');
    return;
  }

  localStorage.setItem('active_wallet', choice);
  document.getElementById('wallet-info').innerText = `✅ Loaded Wallet: ${wallet.address}`;
  showActions();
}

// ⛓️ Chain State
function loadChainState() {
  const state = localStorage.getItem('chain_state');
  if (state) return JSON.parse(state);
  return {
    block_height: 0,
    circulating: 0.0,
    remaining: AVAILABLE_SUPPLY
  };
}

function saveChainState(state) {
  localStorage.setItem('chain_state', JSON.stringify(state));
}

// 📜 Ledger Logging
function logTransaction(sender, receiver, amount) {
  const tx = {
    timestamp: new Date().toISOString(),
    sender,
    receiver,
    amount
  };
  const ledger = JSON.parse(localStorage.getItem('ledger') || '[]');
  ledger.push(tx);
  localStorage.setItem('ledger', JSON.stringify(ledger));
}

// 💸 Transfer Ritual
function sendAksu() {
  const walletId = localStorage.getItem('active_wallet');
  const wallet = JSON.parse(localStorage.getItem(walletId));
  const receiver = prompt('Enter receiver wallet address:').trim();
  const amount = parseFloat(prompt('Enter amount to send:'));
  const receiverWallet = JSON.parse(localStorage.getItem(receiver));

  if (!receiverWallet) {
    alert('❌ Invalid or nonexistent wallet address.');
    return;
  }
  if (wallet.balance < amount) {
    alert('❌ Insufficient balance.');
    return;
  }

  wallet.balance -= amount;
  receiverWallet.balance += amount;
  localStorage.setItem(wallet.address, JSON.stringify(wallet));
  localStorage.setItem(receiverWallet.address, JSON.stringify(receiverWallet));
  logTransaction(wallet.address, receiverWallet.address, amount);

  output(`💸 Sent ${amount} AK$U → ${receiver}\n📉 New Balance: ${wallet.balance} AK$U`);
}

// ⛏️ Mining Ritual
function mineBlock(wallet) {
  const state = loadChainState();
  const blockNumber = state.block_height + 1;
  const entropy = crypto.randomUUID().replace(/-/g, '');
  const proof = Math.floor(Math.random() * (99999 - 1000 + 1)) + 1000;
  const timestamp = new Date().toLocaleString();
  const sigil = `SIGIL_${blockNumber}_${entropy.slice(0, 8)}`;

  wallet.balance += MINT_AMOUNT;
  wallet.last_mined = Date.now();
  localStorage.setItem(wallet.address, JSON.stringify(wallet));

  state.block_height = blockNumber;
  state.circulating = +(state.circulating + MINT_AMOUNT).toFixed(2);
  state.remaining = +(AVAILABLE_SUPPLY - state.circulating).toFixed(2);
  saveChainState(state);

  output(`⛏️ Block ${blockNumber} Mined | ${MINT_AMOUNT} AK$U → ${wallet.address}
🔮 Sigil: ${sigil} | Proof: ${proof} | Time: ${timestamp}
📊 Circulating: ${state.circulating} AK$U | Remaining: ${state.remaining} AK$U
💰 Wallet Balance: ${wallet.balance} AK$U`);
}

// ▶️ Start Mining Ritual (Fresh Every Time)
function startAutoMining() {
  stopAutoMining(); // Clear any previous loop
  miningActive = true;

  const walletId = localStorage.getItem('active_wallet');
  if (!walletId) {
    output('⚠️ No active wallet found.');
    return;
  }

  const wallet = JSON.parse(localStorage.getItem(walletId));

  // Mine immediately
  mineBlock(wallet);

  // Schedule next block every 13 minutes
  miningLoop = setInterval(() => {
    if (!miningActive) return;
    const updatedWallet = JSON.parse(localStorage.getItem(walletId));
    mineBlock(updatedWallet);
  }, BLOCK_INTERVAL);
}

// ⏹️ Stop Mining Ritual
function stopAutoMining() {
  miningActive = false;
  if (miningLoop) {
    clearInterval(miningLoop);
    miningLoop = null;
  }
  output(`🛑 Mining stopped. Protocol paused.`);
}

// 💼 View Balance
function viewBalance() {
  const walletId = localStorage.getItem('active_wallet');
  const wallet = JSON.parse(localStorage.getItem(walletId));
  output(`💼 Wallet: ${wallet.address}\nBalance: ${wallet.balance} AK$U`);
}

// 🔄 Refresh Chain State
function refreshState() {
  const walletId = localStorage.getItem('active_wallet');
  const wallet = JSON.parse(localStorage.getItem(walletId));
  const state = loadChainState();

  output(`🔄 Chain State Refreshed
📊 Circulating: ${state.circulating} AK$U
🧮 Remaining: ${state.remaining} AK$U
💼 Wallet: ${wallet.address}
💰 Balance: ${wallet.balance} AK$U`);
}

// 🧾 Ritual Output
function output(text) {
  document.getElementById('output').innerText = text;
}

function showActions() {
  document.getElementById('actions').style.display = 'block';
}
