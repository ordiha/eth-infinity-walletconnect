// scripts.js
/* global WalletConnectProvider, Web3 */

const ADDR = {
  openMint: "0x79f6e18a8376b02b35C1D5C02DA86Ec03cA6d57d",
  donation: "0x9dDAf52D93FE53715dC510190b2DDD1d1CafA8fB",
  lottery: "0x2eDb3668A8c37a1b1D1934e4247da47FA2c73daf",
  opinion: "0xE74706982Be1c7223E5855EA42DCF96F1104215B",
  guess: "0xe5c4636C0249312fda74492A1a68094C1c08dA54"
};

// minimal ABIs (only the functions we call)
const ABI = {
  mintString: [{ "inputs":[{"internalType":"string","name":"_s","type":"string"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"}],
  donatePayable: [{ "inputs":[],"name":"donate","outputs":[],"stateMutability":"payable","type":"function"}],
  buyTicket: [{ "inputs":[],"name":"buyTicket","outputs":[],"stateMutability":"payable","type":"function"}],
  addOpinion: [{ "inputs":[{"internalType":"string","name":"_op","type":"string"}],"name":"addOpinion","outputs":[],"stateMutability":"nonpayable","type":"function"}],
  guess: [{ "inputs":[{"internalType":"uint256","name":"n","type":"uint256"}],"name":"guess","outputs":[],"stateMutability":"nonpayable","type":"function"}]
};

let web3;
let provider;       // low-level provider (Ethereum provider object)
let activeAccount;  // user address

const $ = id => document.getElementById(id);
const logTx = txt => {
  const el = $("txLog");
  const p = document.createElement("div"); p.innerHTML = txt;
  el.prepend(p);
};

// Unified connect function: prefer injected, else WalletConnect QR
async function connect() {
  try {
    if (window.ethereum) {
      provider = window.ethereum;
      await provider.request({ method: "eth_requestAccounts" });
      web3 = new Web3(provider);
    } else {
      // fallback to WalletConnect
      const wcProvider = new WalletConnectProvider.default({
        rpc: { 8453: "https://mainnet.base.org" },
        qrcode: true
      });
      await wcProvider.enable();
      provider = wcProvider;
      web3 = new Web3(provider);
      // handle disconnect cleanup
      wcProvider.on("disconnect", (code, reason) => {
        console.log("WC disconnect", code, reason);
        $("addr").innerText = "Not connected";
        activeAccount = null;
      });
    }
    const accounts = await web3.eth.getAccounts();
    activeAccount = accounts[0];
    $("addr").innerText = "Connected: " + activeAccount;
    // show chain
    const chainId = await web3.eth.getChainId();
    $("chain").innerText = chainId === 8453 ? "Base mainnet (8453)" : "Chain ID: " + chainId;
    return true;
  } catch (e) {
    console.error("connect err", e);
    alert("Connection failed: " + (e.message||e));
    return false;
  }
}

// helper: send tx and show basic status
async function sendTx(contractInstance, method, options = {}) {
  if (!web3 || !activeAccount) { await connect(); if (!web3) throw new Error("wallet not connected"); }
  return new Promise((resolve, reject) => {
    contractInstance.methods[method](... (options.args||[]) )
      .send({ from: activeAccount, value: options.value || 0 })
      .on("transactionHash", hash => {
        const link = `https://basescan.org/tx/${hash}`;
        logTx(`<a href="${link}" target="_blank">TX ${hash}</a>`);
        resolve(hash);
      })
      .on("error", err => { reject(err); });
  });
}

// actions exposed to index.html
window.actions = {
  // OpenMintNFT: mint(string)
  mintOpen: async () => {
    const val = $("openMintText").value || "hello";
    $("statusOpen").innerText = "Sending...";
    try {
      const c = new web3.eth.Contract(ABI.mintString, ADDR.openMint);
      const hash = await sendTx(c, "mint", { args: [val] });
      $("statusOpen").innerHTML = `✅ Sent — <a href="https://basescan.org/tx/${hash}" target="_blank">${hash.slice(0,10)}...</a>`;
    } catch (e) {
      $("statusOpen").innerText = "❌ " + (e.message || e);
    }
  },

  // DonationTracker2: donate() payable
  donate: async () => {
    const raw = $("donateEth").value || "0";
    const value = web3.utils.toWei(String(raw || "0"), "ether");
    if (Number(raw) <= 0) { $("statusDonate").innerText = "Enter an amount"; return; }
    $("statusDonate").innerText = "Sending...";
    try {
      const c = new web3.eth.Contract(ABI.donatePayable, ADDR.donation);
      const hash = await sendTx(c, "donate", { value });
      $("statusDonate").innerHTML = `✅ Sent — <a href="https://basescan.org/tx/${hash}" target="_blank">${hash.slice(0,10)}...</a>`;
    } catch (e) {
      $("statusDonate").innerText = "❌ " + (e.message || e);
    }
  },

  // Lottery: buyTicket() payable
  buyTicket: async () => {
    const raw = $("lotteryEth").value || "0";
    const value = web3.utils.toWei(String(raw || "0"), "ether");
    if (Number(raw) <= 0) { $("statusLottery").innerText = "Enter an amount"; return; }
    $("statusLottery").innerText = "Sending...";
    try {
      const c = new web3.eth.Contract(ABI.buyTicket, ADDR.lottery);
      const hash = await sendTx(c, "buyTicket", { value });
      $("statusLottery").innerHTML = `✅ Sent — <a href="https://basescan.org/tx/${hash}" target="_blank">${hash.slice(0,10)}...</a>`;
    } catch (e) {
      $("statusLottery").innerText = "❌ " + (e.message || e);
    }
  },

  // OpinionRegistry: addOpinion(string)
  addOpinion: async () => {
    const txt = $("opinionText").value || "Nice!";
    $("statusOpinion").innerText = "Sending...";
    try {
      const c = new web3.eth.Contract(ABI.addOpinion, ADDR.opinion);
      const hash = await sendTx(c, "addOpinion", { args: [txt] });
      $("statusOpinion").innerHTML = `✅ Sent — <a href="https://basescan.org/tx/${hash}" target="_blank">${hash.slice(0,10)}...</a>`;
    } catch (e) {
      $("statusOpinion").innerText = "❌ " + (e.message || e);
    }
  },

  // GuessNumber: guess(uint256)
  guessNumber: async () => {
    const n = Number($("guessNumber").value);
    if (!Number.isInteger(n)) { $("statusGuess").innerText = "Enter an integer"; return; }
    $("statusGuess").innerText = "Sending...";
    try {
      const c = new web3.eth.Contract(ABI.guess, ADDR.guess);
      const hash = await sendTx(c, "guess", { args: [n] });
      $("statusGuess").innerHTML = `✅ Sent — <a href="https://basescan.org/tx/${hash}" target="_blank">${hash.slice(0,10)}...</a>`;
    } catch (e) {
      $("statusGuess").innerText = "❌ " + (e.message || e);
    }
  }
};

// connect button wiring
document.getElementById("btnConnect").addEventListener("click", async () => {
  const ok = await connect();
  if (ok) document.getElementById("btnConnect").innerText = "Wallet connected ✅";
});
