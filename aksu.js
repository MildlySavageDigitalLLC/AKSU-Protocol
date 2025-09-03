// 🔧 Constants
const BLOCK_INTERVAL = 13 * 60 * 1000; // 13 minutes in ms
const MINT_AMOUNT = 23.0;
const TOTAL_SUPPLY = 13000000.0;
const GENESIS_LOCK = 1300000.0;
const AVAILABLE_SUPPLY = TOTAL_SUPPLY - GENESIS_LOCK;
const DIFFICULTY = 4; // Leading zeros required in hash

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

// 🔐 Quantum-Resilient Hash Seal
async function hashSeal(input) {
  const buffer = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-512', buffer);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// 📜 Ledger Logging with Hash Seal
async function logTransaction(sender, receiver, amount) {
  const timestamp = new Date().toISOString();
  const tx = { timestamp, sender, receiver, amount };
  const input = `${timestamp}-${sender}-${receiver}-${amount}`;
  tx.hash = await hashSeal(input);

  const ledger = JSON.parse(localStorage.getItem('ledger') || '[]');
  ledger.push(tx);
  localStorage.setItem('ledger', JSON.stringify(ledger));
}

// 💸 Transfer Ritual
async function sendAksu() {
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
  await logTransaction(wallet.address, receiverWallet.address, amount);

  output(`💸 Sent ${amount} AK$U → ${receiver}\n📉 New Balance: ${wallet.balance} AK$U`);
}

// 📘 Block Logging
function logBlock(block) {
  const log = JSON.parse(localStorage.getItem('block_log') || '[]');
  log.push(block);
  localStorage.setItem('block_log', JSON.stringify(log));
}

function verifyBlocks() {
  const log = JSON.parse(localStorage.getItem('block_log') || '[]');
  if (log.length === 0) {
    output("📭 No blocks to verify.");
    return;
  }

  let report = "🔍 Block Verification Report\n\n";
  log.forEach(b => {
    report += `Block ${b.blockNumber} | ${b.amount} AK$U → ${b.wallet}\n`;
    report += `🕰️ ${b.timestamp} | 🔮 ${b.sigil} | 🔐 Nonce: ${b.nonce}\n`;
    report += `🔗 Hash: ${b.hash}\n\n`;
  });

  output(report);
}

// 🔐 Proof-of-Work Ritual
async function performProofOfWork(blockNumber) {
  let nonce = 0;
  let hash = '';
  const target = '0'.repeat(DIFFICULTY);

  while (true) {
    const input = `${blockNumber}-${Date.now()}-${nonce}`;
    hash = await hashSeal(input);
    if (hash.startsWith(target)) break;
    nonce++;
  }

  return { nonce, hash };
}

// ⛏️ Mining Ritual
async function mineBlock(wallet) {
  const state = loadChainState();
  const blockNumber = state.block_height + 1;
  const entropy = crypto.randomUUID().replace(/-/g, '');
  const timestamp = new Date().toLocaleString();
  const sigil = `SIGIL_${blockNumber}_${entropy.slice(0, 8)}`;
  const { nonce, hash } = await performProofOfWork(blockNumber);

  wallet.balance += MINT_AMOUNT;
  wallet.last_mined = Date.now();
  localStorage.setItem(wallet.address, JSON.stringify(wallet));

  state.block_height = blockNumber;
  state.circulating = +(state.circulating + MINT_AMOUNT).toFixed(2);
  state.remaining = +(AVAILABLE_SUPPLY - state.circulating).toFixed(2);
  saveChainState(state);

  const block = {
    blockNumber,
    timestamp,
    sigil,
    nonce,
    hash,
    wallet: wallet.address,
    amount: MINT_AMOUNT
  };
  logBlock(block);

  output(`⛏️ Block ${blockNumber} Mined | ${MINT_AMOUNT} AK$U → ${wallet.address}
🔮 Sigil: ${sigil} | 🔐 Nonce: ${nonce}
🔗 Hash: ${hash}
📊 Circulating: ${state.circulating} AK$U | Remaining: ${state.remaining} AK$U
💰 Wallet Balance: ${wallet.balance} AK$U`);
}

// ▶️ Start Mining Ritual (Delayed Start)
function startAutoMining() {
  stopAutoMining(); // Clear any previous loop
  miningActive = true;

  const walletId = localStorage.getItem('active_wallet');
  if (!walletId) {
    output('⚠️ No active wallet found.');
    return;
  }

  output(`⏳ Mining ritual initiated. First block will be mined in 13 minutes.`);

  miningLoop = setInterval(async () => {
    if (!miningActive) return;
    const wallet = JSON.parse(localStorage.getItem(walletId));
    await mineBlock(wallet);
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
