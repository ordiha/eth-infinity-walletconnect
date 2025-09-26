// scripts.js — Eth Infinity WalletConnect Integration
// Using WalletConnect v2 (project: eth-infinity-walletconnect)

let provider;
let web3;
let accounts = [];

const CONTRACTS = {
  OpenMintNFT: {
    address: "0x79f6e18a8376b02b35C1D5C02DA86Ec03cA6d57d",
    abi: [
      {
        "inputs": [{ "internalType": "string", "name": "text", "type": "string" }],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ]
  },
  DonationTracker2: {
    address: "0x9dDAf52D93FE53715dC510190b2DDD1d1CafA8fB",
    abi: [
      {
        "inputs": [],
        "name": "donate",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      }
    ]
  },
  Lottery: {
    address: "0x2eDb3668A8c37a1b1D1934e4247da47FA2c73daf",
    abi: [
      {
        "inputs": [],
        "name": "buyTicket",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      }
    ]
  },
  OpinionRegistry: {
    address: "0xE74706982Be1c7223E5855EA42DCF96F1104215B",
    abi: [
      {
        "inputs": [{ "internalType": "string", "name": "opinion", "type": "string" }],
        "name": "addOpinion",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ]
  },
  GuessNumber: {
    address: "0xe5c4636C0249312fda74492A1a68094C1c08dA54",
    abi: [
      {
        "inputs": [{ "internalType": "uint256", "name": "num", "type": "uint256" }],
        "name": "guess",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ]
  }
};

// --- Connect Wallet ---
async function connectWallet() {
  try {
    provider = window.ethereum;

    // If MetaMask or Rabby not available → fallback to WalletConnect
    if (!provider) {
      provider = window.WalletConnectProvider.init({
        projectId: "5056a2b581e5962f9e3083d68053b5d8", // 🚀 your project id
        chains: [8453], // Base Mainnet
        showQrModal: true
      });
      await provider.enable();
    }

    web3 = new Web3(provider);
    accounts = await web3.eth.requestAccounts();
    const chainId = await web3.eth.getChainId();

    document.getElementById("addr").innerText = accounts[0];
    document.getElementById("chain").innerText = "Chain ID: " + chainId;

    log("✅ Wallet connected");
  } catch (err) {
    console.error("Wallet connection failed", err);
    log("❌ Wallet connection failed");
  }
}

// --- Helpers ---
function getContract(name) {
  const c = CONTRACTS[name];
  return new web3.eth.Contract(c.abi, c.address);
}

function log(msg) {
  const div = document.getElementById("txLog");
  div.innerHTML = msg + "<br/>" + div.innerHTML;
}

// --- Actions ---
const actions = {
  mintOpen: async function () {
    try {
      const txt = document.getElementById("openMintText").value;
      const c = getContract("OpenMintNFT");
      const tx = await c.methods.mint(txt).send({ from: accounts[0] });
      document.getElementById("statusOpen").innerText = "✅ Tx: " + tx.transactionHash;
      log("OpenMintNFT minted");
    } catch (e) {
      console.error(e);
      document.getElementById("statusOpen").innerText = "❌ Error";
    }
  },

  donate: async function () {
    try {
      const eth = document.getElementById("donateEth").value;
      const c = getContract("DonationTracker2");
      const tx = await c.methods.donate().send({
        from: accounts[0],
        value: web3.utils.toWei(eth, "ether")
      });
      document.getElementById("statusDonate").innerText = "✅ Tx: " + tx.transactionHash;
      log("Donation sent");
    } catch (e) {
      console.error(e);
      document.getElementById("statusDonate").innerText = "❌ Error";
    }
  },

  buyTicket: async function () {
    try {
      const eth = document.getElementById("lotteryEth").value;
      const c = getContract("Lottery");
      const tx = await c.methods.buyTicket().send({
        from: accounts[0],
        value: web3.utils.toWei(eth, "ether")
      });
      document.getElementById("statusLottery").innerText = "✅ Tx: " + tx.transactionHash;
      log("Lottery ticket bought");
    } catch (e) {
      console.error(e);
      document.getElementById("statusLottery").innerText = "❌ Error";
    }
  },

  addOpinion: async function () {
    try {
      const txt = document.getElementById("opinionText").value;
      const c = getContract("OpinionRegistry");
      const tx = await c.methods.addOpinion(txt).send({ from: accounts[0] });
      document.getElementById("statusOpinion").innerText = "✅ Tx: " + tx.transactionHash;
      log("Opinion submitted");
    } catch (e) {
      console.error(e);
      document.getElementById("statusOpinion").innerText = "❌ Error";
    }
  },

  guessNumber: async function () {
    try {
      const num = document.getElementById("guessNumber").value;
      const c = getContract("GuessNumber");
      const tx = await c.methods.guess(num).send({ from: accounts[0] });
      document.getElementById("statusGuess").innerText = "✅ Tx: " + tx.transactionHash;
      log("Guess sent");
    } catch (e) {
      console.error(e);
      document.getElementById("statusGuess").innerText = "❌ Error";
    }
  }
};

// --- Button binding ---
document.getElementById("btnConnect").addEventListener("click", connectWallet);
