/* scripts.js
   Full file — replace the existing one.
   Uses WalletConnect v2 provider (UMD) via window.EthereumProvider if available.
   Project ID already set to your value so WC v2 will be used (QR modal / deep link).
*/

const PROJECT_ID = "5056a2b581e5962f9e3083d68053b5d8"; // <<< your project id
const BASE_RPC = "https://mainnet.base.org"; // read RPC (used for fallback read tasks)

let provider = null;
let web3 = null;
let accounts = [];

// Contract list (5)
const CONTRACTS = {
  OpenMintNFT: {
    address: "0x79f6e18a8376b02b35C1D5C02DA86Ec03cA6d57d",
    abi: [{ "inputs":[{ "internalType":"string","name":"text","type":"string"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"}]
  },
  DonationTracker2: {
    address: "0x9dDAf52D93FE53715dC510190b2DDD1d1CafA8fB",
    abi: [{ "inputs":[],"name":"donate","outputs":[],"stateMutability":"payable","type":"function"}]
  },
  Lottery: {
    address: "0x2eDb3668A8c37a1b1D1934e4247da47FA2c73daf",
    abi: [{ "inputs":[],"name":"buyTicket","outputs":[],"stateMutability":"payable","type":"function"}]
  },
  OpinionRegistry: {
    address: "0xE74706982Be1c7223E5855EA42DCF96F1104215B",
    abi: [{ "inputs":[{"internalType":"uint256","name":"topicId","type":"uint256"},{"internalType":"string","name":"text","type":"string"}],"name":"addOpinion","outputs":[],"stateMutability":"nonpayable","type":"function"}]
  },
  GuessNumber: {
    address: "0xe5c4636C0249312fda74492A1a68094C1c08dA54",
    abi: [{ "inputs":[{"internalType":"uint256","name":"num","type":"uint256"}],"name":"guess","outputs":[],"stateMutability":"nonpayable","type":"function"}]
  }
};

// small helpers
const $ = id => document.getElementById(id);
const set = (id, v) => { const el = $(id); if (el) el.innerHTML = v; };
const log = txt => { const el = $("txLog"); if (!el) return; const p = document.createElement("div"); p.innerHTML = txt; el.prepend(p); };

// Attempt to initialize WalletConnect provider (v2 UMD). Returns provider instance or throws.
async function initWalletConnectProvider() {
  // Prefer the UMD EthereumProvider if present
  try {
    if (window.EthereumProvider && typeof window.EthereumProvider.init === "function") {
      // official UMD namespace
      return await window.EthereumProvider.init({
        projectId: PROJECT_ID,
        chains: [8453],
        showQrModal: true
      });
    }
    // Some UMD builds expose default under WalletConnectProvider.default
    if (window.WalletConnectProvider && window.WalletConnectProvider.default && typeof window.WalletConnectProvider.default.init === "function") {
      return await window.WalletConnectProvider.default.init({
        projectId: PROJECT_ID,
        chains: [8453],
        showQrModal: true
      });
    }
    // fallback: attempt window.WalletConnectProvider.init
    if (window.WalletConnectProvider && typeof window.WalletConnectProvider.init === "function") {
      return await window.WalletConnectProvider.init({
        projectId: PROJECT_ID,
        chains: [8453],
        showQrModal: true
      });
    }
  } catch (err) {
    console.error("initWalletConnectProvider error", err);
    throw err;
  }
  throw new Error("WalletConnect provider library not found. Check CDN script is loaded.");
}

// Force WalletConnect use (even if injected wallet exists)
async function connectWallet() {
  try {
    set("addr", "Connecting...");
    // initialize WC provider (this opens QR modal if needed)
    provider = await initWalletConnectProvider();

    // enable session (prompts wallet)
    if (typeof provider.enable === "function") {
      await provider.enable();
    } else if (typeof provider.request === "function") {
      await provider.request({ method: "eth_requestAccounts" });
    }

    // create web3 instance
    web3 = new Web3(provider);

    // get accounts
    accounts = await web3.eth.getAccounts();
    if (!accounts || accounts.length === 0) {
      set("addr", "No account found");
      throw new Error("No accounts returned by provider");
    }
    set("addr", accounts[0]);

    // chain id
    const chainId = await web3.eth.getChainId();
    set("chain", (chainId === 8453) ? "Base mainnet (8453)" : "Chain ID: " + chainId);

    log("✅ WalletConnect session ready — account: " + accounts[0]);
    // optionally listen for disconnect (provider may emit 'disconnect' or 'session_delete')
    if (provider.on) {
      provider.on("disconnect", (code, reason) => {
        set("addr", "Not connected");
        set("chain", "");
        accounts = [];
        log("WalletConnect disconnected: " + reason || code);
      });
      try {
        provider.on("accountsChanged", (accs) => {
          accounts = accs;
          set("addr", accs[0] || "Not connected");
        });
      } catch (e) { /* ignore */ }
    }
    return true;
  } catch (err) {
    console.error("connectWallet error:", err);
    set("addr", "Connection failed");
    alert("WalletConnect connection failed: " + (err.message || err));
    return false;
  }
}

// Ensure connected before tx
async function ensureConnectedOrThrow() {
  if (!web3 || !accounts || accounts.length === 0) {
    const ok = await connectWallet();
    if (!ok) throw new Error("WalletConnect not connected");
  }
}

// helper: safe send tx with estimate fallback; returns txHash
async function sendContractTx(contractInstance, methodName, args = [], valueWei = "0") {
  await ensureConnectedOrThrow();
  const from = accounts[0];
  const method = contractInstance.methods[methodName](...args);
  let gasLimit;
  try {
    gasLimit = await method.estimateGas({ from, value: valueWei });
  } catch (e) {
    // fallback gas
    gasLimit = 500000;
  }

  return new Promise((resolve, reject) => {
    method.send({ from, value: valueWei, gas: gasLimit })
      .on("transactionHash", (hash) => resolve(hash))
      .on("error", (err) => reject(err));
  });
}

// Build contract instance
function getContract(name) {
  const c = CONTRACTS[name];
  if (!c) throw new Error("Unknown contract: " + name);
  return new web3.eth.Contract(c.abi, c.address);
}

// UI actions (exposed)
window.actions = {
  // OpenMintNFT: mint(string)
  mintOpen: async () => {
    try {
      set("statusOpen", "Sending...");
      const txt = ( $("openMintText").value || "" ).toString();
      const c = getContract("OpenMintNFT");
      const hash = await sendContractTx(c, "mint", [txt], "0");
      const link = `https://basescan.org/tx/${hash}`;
      set("statusOpen", `✅ <a href="${link}" target="_blank">${hash}</a>`);
      log(`OpenMint tx: <a href="${link}" target="_blank">${hash}</a>`);
    } catch (e) {
      console.error(e);
      set("statusOpen", "❌ " + (e.message || e));
    }
  },

  // DonationTracker2: donate() payable
  donate: async () => {
    try {
      const raw = $("donateEth").value || "0";
      if (Number(raw) <= 0) { set("statusDonate", "Enter amount > 0"); return; }
      set("statusDonate", "Sending...");
      const valueWei = web3.utils.toWei(String(raw), "ether");
      const c = getContract("DonationTracker2");
      const hash = await sendContractTx(c, "donate", [], valueWei);
      const link = `https://basescan.org/tx/${hash}`;
      set("statusDonate", `✅ <a href="${link}" target="_blank">${hash}</a>`);
      log(`Donate tx: <a href="${link}" target="_blank">${hash}</a>`);
    } catch (e) {
      console.error(e);
      set("statusDonate", "❌ " + (e.message || e));
    }
  },

  // Lottery: buyTicket() payable
  buyTicket: async () => {
    try {
      const raw = $("lotteryEth").value || "0";
      if (Number(raw) <= 0) { set("statusLottery", "Enter amount > 0"); return; }
      set("statusLottery", "Sending...");
      const valueWei = web3.utils.toWei(String(raw), "ether");
      const c = getContract("Lottery");
      const hash = await sendContractTx(c, "buyTicket", [], valueWei);
      const link = `https://basescan.org/tx/${hash}`;
      set("statusLottery", `✅ <a href="${link}" target="_blank">${hash}</a>`);
      log(`Lottery tx: <a href="${link}" target="_blank">${hash}</a>`);
    } catch (e) {
      console.error(e);
      set("statusLottery", "❌ " + (e.message || e));
    }
  },

  // OpinionRegistry: addOpinion(uint256 topicId, string text)
  addOpinion: async () => {
    try {
      const topicRaw = $("opinionTopic").value;
      const text = ($("opinionText").value || "").toString();
      const topicId = Number(topicRaw);
      if (!Number.isInteger(topicId)) { set("statusOpinion", "Enter integer Topic ID"); return; }
      set("statusOpinion", "Sending...");
      const c = getContract("OpinionRegistry");
      const hash = await sendContractTx(c, "addOpinion", [topicId, text], "0");
      const link = `https://basescan.org/tx/${hash}`;
      set("statusOpinion", `✅ <a href="${link}" target="_blank">${hash}</a>`);
      log(`Opinion tx: <a href="${link}" target="_blank">${hash}</a>`);
    } catch (e) {
      console.error(e);
      set("statusOpinion", "❌ " + (e.message || e));
    }
  },

  // GuessNumber: guess(uint256)
  guessNumber: async () => {
    try {
      const raw = $("guessNumber").value;
      const n = Number(raw);
      if (!Number.isInteger(n)) { set("statusGuess", "Enter integer"); return; }
      set("statusGuess", "Sending...");
      const c = getContract("GuessNumber");
      const hash = await sendContractTx(c, "guess", [n], "0");
      const link = `https://basescan.org/tx/${hash}`;
      set("statusGuess", `✅ <a href="${link}" target="_blank">${hash}</a>`);
      log(`Guess tx: <a href="${link}" target="_blank">${hash}</a>`);
    } catch (e) {
      console.error(e);
      set("statusGuess", "❌ " + (e.message || e));
    }
  }
};

// connect button wired
const btn = $("btnConnect");
if (btn) btn.addEventListener("click", connectWallet);

// End of file
