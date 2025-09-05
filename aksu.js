// Constants
const AVAILABLE_SUPPLY = 21000000;
const MINT_AMOUNT = 50;
let miningInterval = null;

// Load chain state
function loadChainState() {
  const state = JSON.parse(localStorage.getItem('chain_state'));
  return state || {
    block_height: 0,
    circulating: 0,
    remaining: AVAILABLE_SUPPLY
  };
}

// Save chain state
function saveChainState(state) {
  localStorage.setItem('chain_state', JSON.stringify(state));
}

// Create wallet
function createWallet() {
  const address = 'AKSU_' + Math.random().toString(36).substring(2, 10).toUpperCase();
  const wallet = {
    address,
    balance: 0,
    last_mined: null
  };
  localStorage.setItem(address, JSON.stringify(wallet));
  localStorage.setItem('current_wallet', address);
  document.getElementById('wallet-info').textContent = `🔐 Wallet Created: ${address}`;
}

// Load wallet
function loadWallet() {
  const address = localStorage.getItem('current_wallet');
  if (!address) {
    output('⚠️ No wallet found.');
    return;
  }
  const wallet = JSON.parse(localStorage.getItem(address));
  document.getElementById('wallet-info').textContent = `🔐 Wallet Loaded: ${wallet.address}`;
}

// Load wallet from storage
function loadWalletFromStorage() {
  const address = localStorage.getItem('current_wallet');
  if (!address) return null;
  return JSON.parse(localStorage.getItem(address));
}

// Start mining
function startAutoMining() {
  const wallet = loadWalletFromStorage();
  if (!wallet) {
    output('⚠️ Load a wallet first.');
    return;
  }
  output('⛏️ Mining started...');
  mineBlock(wallet);
  miningInterval = setInterval(() => mineBlock(wallet), 121000); // 2m1s
}

// Stop mining
function stopAutoMining() {
  clearInterval(miningInterval);
  output('🛑 Mining stopped.');
}

// Mine a block
function mineBlock(wallet) {
  const state = loadChainState();
  const blockNumber = state.block_height + 1;

  if (state.remaining < MINT_AMOUNT) {
    output('⛔ No remaining supply to mine.');
    stopAutoMining();
    return;
  }

  wallet.balance += MINT_AMOUNT;
  wallet.last_mined = new Date().toISOString();
  state.block_height = blockNumber;
  state.circulating = +(state.circulating + MINT_AMOUNT).toFixed(2);
  state.remaining = +(AVAILABLE_SUPPLY - state.circulating).toFixed(2);

  localStorage.setItem(wallet.address, JSON.stringify(wallet));
  saveChainState(state);

  logTransaction('MINING_REWARD', wallet.address, MINT_AMOUNT);
  logManifestEvent('BLOCK_MINED', wallet, blockNumber);

  output(`⛏️ Block #${blockNumber} mined
🔄 Circulating: ${state.circulating} AK$U
🧮 Remaining: ${state.remaining} AK$U
💰 Wallet Balance: ${wallet.balance} AK$U`);
  animateBlock();
}

// Send AK$U
function sendAksu() {
  const wallet = loadWalletFromStorage();
  if (!wallet) {
    output('⚠️ Load a wallet first.');
    return;
  }
  if (wallet.balance < MINT_AMOUNT) {
    output('⛔ Insufficient balance.');
    return;
  }
  wallet.balance -= MINT_AMOUNT;
  localStorage.setItem(wallet.address, JSON.stringify(wallet));
  logTransaction('TRANSFER', wallet.address, MINT_AMOUNT);
  output(`📨 Sent ${MINT_AMOUNT} AK$U from ${wallet.address}`);
}

// View balance and chain state
function viewBalance() {
  const wallet = loadWalletFromStorage();
  const state = loadChainState();
  if (!wallet) {
    output('⚠️ No wallet loaded.');
    return;
  }
  output(`💼 Wallet: ${wallet.address}
💰 Balance: ${wallet.balance} AK$U
📦 Block Height: ${state.block_height}
🔄 Circulating: ${state.circulating} AK$U
🧮 Remaining: ${state.remaining} AK$U`);
}

// Verify blocks (placeholder)
function verifyBlocks() {
  const state = loadChainState();
  output(`📜 Verifying ledger...
✅ Block Height: ${state.block_height}
🔄 Circulating: ${state.circulating} AK$U
🧮 Remaining: ${state.remaining} AK$U`);
}

// Output to console
function output(text) {
  const out = document.getElementById('output');
  out.textContent = text;
  out.classList.add('block-flash');
  setTimeout(() => out.classList.remove('block-flash'), 1000);
}

// Animate block flash
function animateBlock() {
  const out = document.getElementById('output');
  out.classList.add('block-flash');
  setTimeout(() => out.classList.remove('block-flash'), 1000);
}

// Log transaction
function logTransaction(type, address, amount) {
  const tx = {
    type,
    address,
    amount,
    timestamp: new Date().toISOString()
  };
  const ledger = JSON.parse(localStorage.getItem('ledger') || '[]');
  ledger.push(tx);
  localStorage.setItem('ledger', JSON.stringify(ledger));
}

// Log manifest event
function logManifestEvent(type, wallet, blockNumber) {
  const entry = {
    type,
    wallet: wallet.address,
    block: blockNumber,
    timestamp: new Date().toISOString()
  };
  const manifest = JSON.parse(localStorage.getItem('manifest') || '[]');
  manifest.push(entry);
  localStorage.setItem('manifest', JSON.stringify(manifest));
}

// Restore mining screen
function showMiningScreen() {
  document.getElementById('wallet-section').style.display = 'flex';
  document.getElementById('actions').style.display = 'flex';
  document.getElementById('instructions').style.display = 'block';
  document.getElementById('output').style.display = 'block';
}
