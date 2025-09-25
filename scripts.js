// scripts.js - full file (replace existing)
/// Supports injected wallets (MetaMask/Rabby) and WalletConnect fallback.
/// Ensures connection before sending tx, handles errors, updates statuses.

let web3;
let provider;
let accounts = [];
const BASE_RPC = "https://mainnet.base.org"; // Base mainnet RPC (chainId 8453)

// Contract addresses (your deployed contracts)
const ADDR = {
  openMint: "0x79f6e18a8376b02b35C1D5C02DA86Ec03cA6d57d",
  donation: "0x9dDAf52D93FE53715dC510190b2DDD1d1CafA8fB",
  lottery: "0x2eDb3668A8c37a1b1D1934e4247da47FA2c73daf",
  opinion: "0xE74706982Be1c7223E5855EA42DCF96F1104215B",
  guess: "0xe5c4636C0249312fda74492A1a68094C1c08dA54"
};

// Minimal ABIs for functions used
const ABI = {
  mintString: [{ "inputs":[{ "internalType":"string","name":"_s","type":"string" }], "name":"mint", "outputs":[], "stateMutability":"nonpayable", "type":"function" }],
  donate: [{ "inputs":[], "name":"donate", "outputs":[], "stateMutability":"payable", "type":"function" }],
  buyTicket: [{ "inputs":[], "name":"buyTicket", "outputs":[], "stateMutability":"payable", "type":"function" }],
  addOpinion: [
    { "inputs":[ { "internalType":"uint256","name":"topicId","type":"uint256" }, { "internalType":"string","name":"text","type":"string" } ],
      "name":"addOpinion","outputs":[],"stateMutability":"nonpayable","type":"function" }
  ],
  guess: [{ "inputs":[{ "internalType":"uint256","name":"n","type":"uint256"}], "name":"guess","outputs":[],"stateMutability":"nonpayable","type":"function" }]
};

// UI helpers
const $ = id => document.getElementById(id);
const setStatus = (id, txt) => { const el = $(id); if (el) el.innerHTML = txt; };
const logTx = txt => { const el = $("txLog"); if (!el) return; const p = document.createElement("div"); p.innerHTML = txt; el.prepend(p); };

// Try to connect using injected provider first, else WalletConnect
async function connectWalletFlow() {
  try {
    if (window.ethereum) {
      provider = window.ethereum;
      // Request accounts
      await provider.request({ method: 'eth_requestAccounts' });
      web3 = new Web3(provider);
    } else {
      // fallback: WalletConnectProvider (UMD)
      const WalletConnectProvider = window.WalletConnectProvider.default;
      provider = new WalletConnectProvider({
        rpc: { 8453: BASE_RPC },
        qrcode: true
      });
      await provider.enable();
      web3 = new Web3(provider);
      // listen for disconnect
      provider.on && provider.on("disconnect", (code, reason) => {
        accounts = [];
        $("addr").innerText = "Not connected";
        $("chain").innerText = "";
        logTx("WalletConnect disconnected");
      });
    }

    accounts = await web3.eth.getAccounts();
    if (accounts && accounts[0]) {
      $("addr").innerText = "Connected: " + accounts[0];
      const chainId = await web3.eth.getChainId();
      $("chain").innerText = chainId === 8453 ? "Base mainnet (8453)" : "Chain ID: " + chainId;
      return true;
    } else {
      throw new Error("No accounts found");
    }
  } catch (err) {
    console.error("connectWalletFlow error:", err);
    alert("Connection failed: " + (err.message || err));
    return false;
  }
}

// Bound to Connect button
document.getElementById("btnConnect").addEventListener("click", async () => {
  const ok = await connectWalletFlow();
  if (ok) document.getElementById("btnConnect").innerText = "Wallet connected ✅";
});

// ensure web3 + accounts ready
async function ensureConnected() {
  if (!web3 || !accounts || accounts.length === 0) {
    const ok = await connectWalletFlow();
    if (!ok) throw new Error("Wallet not connected");
  }
}

// Generic sendTx: estimates gas, sends, returns txHash
async function sendTx(contractInstance, methodName, args = [], value = "0") {
  await ensureConnected();
  const from = accounts[0];
  const method = contractInstance.methods[methodName](...args);
  let gas;
  try {
    gas = await method.estimateGas({ from, value });
  } catch (e) {
    // if estimateGas fails, try with a fallback gas limit
    gas = 500000;
  }
  return new Promise((resolve, reject) => {
    method.send({ from, value, gas })
      .on("transactionHash", hash => { resolve(hash); })
      .on("error", err => { reject(err); });
  });
}

// Actions exposed for index.html buttons
window.actions = {
  // OpenMintNFT: mint(string)
  mintOpen: async () => {
    const txt = ($("openMintText").value || "").toString();
    setStatus("statusOpen", "Sending...");
    try {
      const c = new web3.eth.Contract(ABI.mintString, ADDR.openMint);
      const hash = await sendTx(c, "mint", [txt], "0");
      setStatus("statusOpen", `✅ Sent — <a href="https://basescan.org/tx/${hash}" target="_blank">${hash}</a>`);
      logTx(`<a href="https://basescan.org/tx/${hash}" target="_blank">OpenMint tx: ${hash}</a>`);
    } catch (e) {
      setStatus("statusOpen", "❌ " + (e.message || e));
    }
  },

  // DonationTracker2: donate() payable
  donate: async () => {
    const raw = $("donateEth").value || "0";
    if (Number(raw) <= 0) { setStatus("statusDonate", "Enter an amount > 0"); return; }
    setStatus("statusDonate", "Sending...");
    try {
      const value = web3.utils.toWei(String(raw), "ether");
      const c = new web3.eth.Contract(ABI.donate, ADDR.donation);
      const hash = await sendTx(c, "donate", [], value);
      setStatus("statusDonate", `✅ Sent — <a href="https://basescan.org/tx/${hash}" target="_blank">${hash}</a>`);
      logTx(`<a href="https://basescan.org/tx/${hash}" target="_blank">Donate tx: ${hash}</a>`);
    } catch (e) {
      setStatus("statusDonate", "❌ " + (e.message || e));
    }
  },

  // Lottery: buyTicket() payable
  buyTicket: async () => {
    const raw = $("lotteryEth").value || "0";
    if (Number(raw) <= 0) { setStatus("statusLottery", "Enter an amount > 0"); return; }
    setStatus("statusLottery", "Sending...");
    try {
      const value = web3.utils.toWei(String(raw), "ether");
      const c = new web3.eth.Contract(ABI.buyTicket, ADDR.lottery);
      const hash = await sendTx(c, "buyTicket", [], value);
      setStatus("statusLottery", `✅ Sent — <a href="https://basescan.org/tx/${hash}" target="_blank">${hash}</a>`);
      logTx(`<a href="https://basescan.org/tx/${hash}" target="_blank">Lottery tx: ${hash}</a>`);
    } catch (e) {
      setStatus("statusLottery", "❌ " + (e.message || e));
    }
  },

  // OpinionRegistry: addOpinion(uint256, string)  <- FIXED (topicId + text)
  addOpinion: async () => {
    const topicRaw = $("opinionTopic").value;
    const txt = ($("opinionText").value || "").toString();
    const topicId = Number(topicRaw);
    if (!Number.isInteger(topicId)) { setStatus("statusOpinion", "Enter a valid Topic ID (integer)"); return; }
    setStatus("statusOpinion", "Sending...");
    try {
      const c = new web3.eth.Contract(ABI.addOpinion, ADDR.opinion);
      const hash = await sendTx(c, "addOpinion", [topicId, txt], "0");
      setStatus("statusOpinion", `✅ Sent — <a href="https://basescan.org/tx/${hash}" target="_blank">${hash}</a>`);
      logTx(`<a href="https://basescan.org/tx/${hash}" target="_blank">Opinion tx: ${hash}</a>`);
    } catch (e) {
      setStatus("statusOpinion", "❌ " + (e.message || e));
    }
  },

  // GuessNumber: guess(uint256)
  guessNumber: async () => {
    const n = Number($("guessNumber").value);
    if (!Number.isInteger(n)) { setStatus("statusGuess", "Enter an integer"); return; }
    setStatus("statusGuess", "Sending...");
    try {
      const c = new web3.eth.Contract(ABI.guess, ADDR.guess);
      const hash = await sendTx(c, "guess", [n], "0");
      setStatus("statusGuess", `✅ Sent — <a href="https://basescan.org/tx/${hash}" target="_blank">${hash}</a>`);
      logTx(`<a href="https://basescan.org/tx/${hash}" target="_blank">Guess tx: ${hash}</a>`);
    } catch (e) {
      setStatus("statusGuess", "❌ " + (e.message || e));
    }
  }
};
