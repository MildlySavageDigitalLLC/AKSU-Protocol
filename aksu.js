// 🔧 Constants
const BLOCK_INTERVAL = 121 * 1000; // 2 minutes 1 second
const MINT_AMOUNT = 13.0;
const TOTAL_SUPPLY = 13000000.0;
const GENESIS_LOCK = 1000000.0;
const AVAILABLE_SUPPLY = TOTAL_SUPPLY - GENESIS_LOCK;
const DIFFICULTY = 4;

let miningLoop = null;
let miningActive = false;
let miningStarted = false;

// 🪪 Wallet Functions
function generateWalletAddress() {
  const entropy = crypto.randomUUID().replace(/-/g, '');
  return 'WALLET_' + entropy.slice(0, 12);
}

function createWallet() {
  const address = generateWalletAddress();
  const wallet = { address, balance: 0.0, last_mined: null };
  localStorage.setItem(address, JSON.stringify(wallet));
  localStorage.setItem('active_wallet', address);
  document.getElementById('wallet-info').innerText = `🆕 Created Wallet: ${address}`;
  showActions();
}

function loadWallet() {
  const choice = prompt("🔐 Enter wallet ID:");
  if (!choice) return alert('⚠️ No wallet ID entered.');
  const wallet = JSON.parse(localStorage.getItem(choice));
  if (!wallet) return alert('❌ Wallet not found.');
  localStorage.setItem('active_wallet', choice);
  document.getElementById('wallet-info').innerText = `✅ Loaded Wallet: ${wallet.address}`;
  showActions();
}

// ⛓️ Chain State
function loadChainState() {
  const state = localStorage.getItem('chain_state');
  return state ? JSON.parse(state) : {
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

// 📜 Ledger Logging
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
  if (!receiverWallet) return alert('❌ Invalid or nonexistent wallet address.');
  if (wallet.balance < amount) return alert('❌ Insufficient balance.');
  wallet.balance -= amount;
  receiverWallet.balance += amount;
  localStorage.setItem(wallet.address, JSON.stringify(wallet));
  localStorage.setItem(receiverWallet.address, JSON.stringify(receiverWallet));
  await logTransaction(wallet.address, receiverWallet.address, amount);
  output(`💸 Sent ${amount} AK$U → ${receiver}\n📉 New Balance: ${wallet.balance} AK$U`);
}

// ⛏️ Start Mining Ritual (Immediate, One-Time Activation)
function startAutoMining() {
  if (miningStarted || miningActive) return;
  miningStarted = true;
  miningActive = true;

  const walletId = localStorage.getItem('active_wallet');
  if (!walletId) {
    output('⚠️ No active wallet found.');
    return;
  }

  const wallet = JSON.parse(localStorage.getItem(walletId));
  mineBlock(wallet); // ⛏️ Mine first block immediately

  miningLoop = setInterval(async () => {
    if (!miningActive) return;
    const updatedWallet = JSON.parse(localStorage.getItem(walletId));
    await mineBlock(updatedWallet);
  }, BLOCK_INTERVAL);
}

// ⏹️ Stop Mining Ritual
function stopAutoMining() {
  miningActive = false;
  miningStarted = false;
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
  const el = document.getElementById('output');
  el.classList.remove('block-flash');
  el.innerText = text;
}

// 🔁 Block Animation Trigger
function animateBlock() {
  const el = document.getElementById('output');
  el.classList.add('block-flash');
  setTimeout(() => el.classList.remove('block-flash'), 1000);
}

// 🔙 Back to Mining View
function showMiningScreen() {
  document.getElementById('wallet-section').style.display = 'flex';
  document.getElementById('actions').style.display = 'flex';
  document.getElementById('instructions').style.display = 'block';
  document.getElementById('output').style.display = 'block';
}

// 🧭 Show Action Buttons + Ensure Wallet Controls Stay Visible
function showActions() {
  document.getElementById('actions').style.display = 'flex';
  document.getElementById('wallet-section').style.display = 'flex';

  if (!document.getElementById('verify-button')) {
    const btn = document.createElement('button');
    btn.id = 'verify-button';
    btn.innerText = '📜 Verify Ledger';
    btn.onclick = verifyBlocks;
    document.querySelector('.button-row.bottom-row').appendChild(btn);
  }

  if (!document.getElementById('back-button')) {
    const backBtn = document.createElement('button');
    backBtn.id = 'back-button';
    backBtn.innerText = '🔙 Back to Mining';
    backBtn.onclick = showMiningScreen;
    document.querySelector('.button-row.back-row')?.appendChild(backBtn);
  }
}
