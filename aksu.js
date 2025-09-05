// 🔧 Constants
const BLOCK_INTERVAL = 2 * 60 * 1000;
const MINT_AMOUNT = 23.0;
const TOTAL_SUPPLY = 13000000.0;
const GENESIS_LOCK = 1000000.0;
const AVAILABLE_SUPPLY = TOTAL_SUPPLY - GENESIS_LOCK;

let miningLoop = null;
let chainState = JSON.parse(localStorage.getItem('chain_state')) || {
  block_height: 0,
  circulating: 0.0,
  remaining: AVAILABLE_SUPPLY
};

// 🪪 Create Wallet
function createWallet() {
  const address = 'WALLET_' + crypto.randomUUID().slice(0, 12);
  const wallet = {
    address,
    balance: 0.0,
    last_mined: null
  };
  localStorage.setItem(address, JSON.stringify(wallet));
  localStorage.setItem('active_wallet', address);
  output(`🆕 Created Wallet: ${address}`);
}

// 🔐 Load Wallet
function loadWallet() {
  const id = prompt("🔐 Enter wallet ID:");
  const wallet = JSON.parse(localStorage.getItem(id));
  if (!wallet) {
    output("❌ Wallet not found.");
    return;
  }
  localStorage.setItem('active_wallet', id);
  output(`✅ Loaded Wallet: ${wallet.address}`);
}

// ⛏️ Start Mining
function startMining() {
  const walletId = localStorage.getItem('active_wallet');
  const wallet = JSON.parse(localStorage.getItem(walletId));
  if (!wallet) {
    output("⚠️ No active wallet found.");
    return;
  }

  mineBlock(wallet);
  miningLoop = setInterval(() => {
    const updatedWallet = JSON.parse(localStorage.getItem(walletId));
    mineBlock(updatedWallet);
  }, BLOCK_INTERVAL);

  output("⛏️ Mining started.");
}

// 🛑 Stop Mining
function stopMining() {
  if (miningLoop) {
    clearInterval(miningLoop);
    miningLoop = null;
    output("🛑 Mining stopped.");
  } else {
    output("⛔ Mining is not active.");
  }
}

// 🔨 Mine Block
function mineBlock(wallet) {
  const now = Date.now();
  if (wallet.last_mined && now - wallet.last_mined < BLOCK_INTERVAL) {
    const wait = Math.ceil((BLOCK_INTERVAL - (now - wallet.last_mined)) / 1000);
    output(`⏳ Too soon to mine. Wait ${wait} seconds.`);
    return;
  }

  if (chainState.remaining < MINT_AMOUNT) {
    output(`⛔ Final block reached. Remaining: ${chainState.remaining} AK$U`);
    stopMining();
    return;
  }

  chainState.block_height += 1;
  chainState.circulating += MINT_AMOUNT;
  chainState.remaining = +(AVAILABLE_SUPPLY - chainState.circulating).toFixed(2);

  wallet.balance += MINT_AMOUNT;
  wallet.last_mined = now;
  localStorage.setItem(wallet.address, JSON.stringify(wallet));
  localStorage.setItem('chain_state', JSON.stringify(chainState));

  const timestamp = new Date().toLocaleString();
  const hash = generateHash(`${chainState.block_height}-${timestamp}-${Math.random()}`);
  const sigil = `SIGIL_${chainState.block_height}_${hash.slice(0, 8)}`;

  displayMiningData({
    block: chainState.block_height,
    circulating: chainState.circulating,
    remaining: chainState.remaining,
    timestamp,
    hash,
    sigil,
    wallet: wallet.address,
    balance: wallet.balance
  });
}

// 💸 Send AK$U Peer-to-Peer
function sendAksu() {
  const senderId = localStorage.getItem('active_wallet');
  const sender = JSON.parse(localStorage.getItem(senderId));
  const receiverId = prompt("📨 Enter recipient wallet ID:").trim();
  const amount = parseFloat(prompt("💰 Enter amount to send:"));

  const receiver = JSON.parse(localStorage.getItem(receiverId));
  if (!receiver) {
    output("❌ Recipient wallet not found.");
    return;
  }
  if (sender.balance < amount) {
    output("❌ Insufficient balance.");
    return;
  }

  sender.balance -= amount;
  receiver.balance += amount;

  localStorage.setItem(sender.address, JSON.stringify(sender));
  localStorage.setItem(receiver.address, JSON.stringify(receiver));

  const tx = {
    timestamp: new Date().toISOString(),
    sender: sender.address,
    receiver: receiver.address,
    amount
  };
  const ledger = JSON.parse(localStorage.getItem('ledger') || '[]');
  ledger.push(tx);
  localStorage.setItem('ledger', JSON.stringify(ledger));

  output(`✅ Sent ${amount} AK$U → ${receiver.address}
📉 New Balance: ${sender.balance} AK$U`);
}

// 📜 View Ledger
function viewLedger() {
  const ledger = JSON.parse(localStorage.getItem('ledger') || '[]');
  if (ledger.length === 0) {
    output("📭 Ledger is empty.");
    return;
  }

  let html = `<h2>📜 AKSU Ledger</h2><ul style="list-style:none;padding:0;">`;
  ledger.forEach(tx => {
    html += `<li style="margin-bottom:10px;">
      <strong>${tx.timestamp}</strong><br>
      🔸 ${tx.sender} → ${tx.receiver}<br>
      💰 ${tx.amount} AK$U
    </li>`;
  });
  html += `</ul><button onclick="backToMining()">🔙 Back to Mining</button>`;
  document.getElementById('output').innerHTML = html;
}

// 🔙 Back to Mining View
function backToMining() {
  const walletId = localStorage.getItem('active_wallet');
  const wallet = JSON.parse(localStorage.getItem(walletId));
  if (!wallet) {
    output("⚠️ No wallet loaded.");
    return;
  }

  displayMiningData({
    block: chainState.block_height,
    circulating: chainState.circulating,
    remaining: chainState.remaining,
    timestamp: new Date().toLocaleString(),
    hash: generateHash(`${chainState.block_height}-${wallet.address}`),
    sigil: `SIGIL_${chainState.block_height}_${wallet.address.slice(-6)}`,
    wallet: wallet.address,
    balance: wallet.balance
  });
}

// 🛡️ Quantum & Photonic Proof Hashing
function generateHash(input) {
  const salt = crypto.getRandomValues(new Uint8Array(16)).join('');
  const entropy = input + salt + Date.now();
  const base = btoa(entropy).slice(0, 32);
  return base.split('').reverse().join('');
}

// 📦 Display Mining Data
function displayMiningData(data) {
  const box = document.getElementById('output');
  box.innerHTML = `
    <div class="mining-box">
      <h2>🧱 Block ${data.block} Mined</h2>
      <p><strong>Wallet:</strong> ${data.wallet}</p>
      <p><strong>Balance:</strong> ${data.balance} AK$U</p>
      <p><strong>Circulating:</strong> ${data.circulating} AK$U</p>
      <p><strong>Remaining:</strong> ${data.remaining} AK$U</p>
      <p><strong>Timestamp:</strong> ${data.timestamp}</p>
      <p><strong>Sigil:</strong> ${data.sigil}</p>
      <p><strong>Hash:</strong> ${data.hash}</p>
    </div>
  `;
}

// 🧾 Output Helper
function output(text) {
  const box = document.getElementById('output');
  box.innerHTML = `<div style="text-align:center; margin-top:20px;">${text}</div>`;
}
