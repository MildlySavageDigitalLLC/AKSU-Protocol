// 🔧 Constants
const BLOCK_INTERVAL = 121 * 1000;
const MINT_AMOUNT = 13.0;
const TOTAL_SUPPLY = 13000000.0;
const GENESIS_LOCK = 1300000.0;
const AVAILABLE_SUPPLY = TOTAL_SUPPLY - GENESIS_LOCK;

let miningLoop = null;
let chainState = {
  circulating: 0,
  remaining: AVAILABLE_SUPPLY,
  block_height: 0
};

// ⛏️ Start Mining
function startMining() {
  mineBlock(); // Mine immediately
  miningLoop = setInterval(mineBlock, BLOCK_INTERVAL);
  output("⛏️ Mining started...");
}

// 🛑 Stop Mining
function stopMining() {
  clearInterval(miningLoop);
  miningLoop = null;
  output("🛑 Mining stopped.");
}

// 🔨 Mine Block
function mineBlock() {
  if (chainState.remaining < MINT_AMOUNT) {
    output("⛔ No remaining supply.");
    stopMining();
    return;
  }

  chainState.block_height += 1;
  chainState.circulating += MINT_AMOUNT;
  chainState.remaining = +(AVAILABLE_SUPPLY - chainState.circulating).toFixed(2);

  const timestamp = new Date().toLocaleString();
  const hash = generateHash(`${chainState.block_height}-${timestamp}-${Math.random()}`);

  displayMiningData({
    block: chainState.block_height,
    circulating: chainState.circulating,
    remaining: chainState.remaining,
    timestamp,
    hash
  });
}

// 🔐 Simple Hash Generator
function generateHash(input) {
  return btoa(input).slice(0, 32); // Base64 stub
}

// 📦 Display Mining Data
function displayMiningData(data) {
  const box = document.getElementById('output');
  box.innerHTML = `
    <div style="
      background:#111;
      color:#0f0;
      border:2px solid #0f0;
      padding:20px;
      border-radius:12px;
      max-width:600px;
      margin:40px auto;
      text-align:center;
      font-family:monospace;
      box-shadow:0 0 20px #0f0;
    ">
      <h2>🧱 Block ${data.block} Mined</h2>
      <p><strong>Circulating:</strong> ${data.circulating} AK$U</p>
      <p><strong>Remaining:</strong> ${data.remaining} AK$U</p>
      <p><strong>Timestamp:</strong> ${data.timestamp}</p>
      <p><strong>Hash:</strong> ${data.hash}</p>
    </div>
  `;
}

// 🧾 Output Helper
function output(text) {
  const box = document.getElementById('output');
  box.innerHTML = `<div style="text-align:center; margin-top:20px;">${text}</div>`;
}
