let web3;
let accounts = [];

// Connect wallet via injected provider (MetaMask, Rabby, or WC extension)
async function connectWallet() {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    try {
      accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      document.getElementById("walletAddress").innerText = "Connected: " + accounts[0];
    } catch (err) {
      alert("Connection rejected.");
    }
  } else {
    alert("No Ethereum wallet detected. Please install MetaMask or Rabby.");
  }
}

// Contract addresses
const ADDR = {
  openMint: "0x79f6e18a8376b02b35C1D5C02DA86Ec03cA6d57d",
  colorNFT: "0x7e5b2523Da5D63e500b9b050f45f993b811c6548",
  timeNFT: "0x6A7b0FD9Ea1809a5F0F4369e191a0B021D11BCD5",
  evolving: "0xFAb4D080D6b1AF6d84685148f9D6a7195f86b829",
  opinion: "0xE74706982Be1c7223E5855EA42DCF96F1104215B"
};

// ABIs
const ABI = {
  openMint: [{"inputs":[{"internalType":"string","name":"txt","type":"string"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"}],
  colorNFT: [{"inputs":[{"internalType":"string","name":"color","type":"string"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"}],
  timeNFT: [{"inputs":[],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"}],
  evolving: [{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"evolve","outputs":[],"stateMutability":"nonpayable","type":"function"}],
  opinion: [{"inputs":[{"internalType":"uint256","name":"topicId","type":"uint256"},{"internalType":"string","name":"text","type":"string"}],"name":"addOpinion","outputs":[],"stateMutability":"nonpayable","type":"function"}]
};

// Send transaction
async function sendTx(contract, method, args = [], value = 0) {
  const tx = contract.methods[method](...args);
  const gas = await tx.estimateGas({ from: accounts[0], value });
  return tx.send({ from: accounts[0], gas, value })
    .once('transactionHash', (hash) => hash);
}

// Actions
const actions = {
  // OpenMintNFT
  mintOpenNFT: async () => {
    const txt = document.getElementById("openMintInput").value || "Hello";
    document.getElementById("statusOpenMint").innerText = "Sending...";
    try {
      const c = new web3.eth.Contract(ABI.openMint, ADDR.openMint);
      const hash = await sendTx(c, "mint", [txt]);
      document.getElementById("statusOpenMint").innerHTML = `✅ Sent — <a href="https://basescan.org/tx/${hash}" target="_blank">${hash.slice(0,10)}...</a>`;
    } catch (e) {
      document.getElementById("statusOpenMint").innerText = "❌ " + (e.message || e);
    }
  },

  // ColorNFT
  mintColorNFT: async () => {
    const color = document.getElementById("colorNFTInput").value || "#00FF00";
    document.getElementById("statusColorNFT").innerText = "Sending...";
    try {
      const c = new web3.eth.Contract(ABI.colorNFT, ADDR.colorNFT);
      const hash = await sendTx(c, "mint", [color]);
      document.getElementById("statusColorNFT").innerHTML = `✅ Sent — <a href="https://basescan.org/tx/${hash}" target="_blank">${hash.slice(0,10)}...</a>`;
    } catch (e) {
      document.getElementById("statusColorNFT").innerText = "❌ " + (e.message || e);
    }
  },

  // TimeNFT
  mintTimeNFT: async () => {
    document.getElementById("statusTimeNFT").innerText = "Sending...";
    try {
      const c = new web3.eth.Contract(ABI.timeNFT, ADDR.timeNFT);
      const hash = await sendTx(c, "mint");
      document.getElementById("statusTimeNFT").innerHTML = `✅ Sent — <a href="https://basescan.org/tx/${hash}" target="_blank">${hash.slice(0,10)}...</a>`;
    } catch (e) {
      document.getElementById("statusTimeNFT").innerText = "❌ " + (e.message || e);
    }
  },

  // EvolvingNFT
  evolveNFT: async () => {
    const id = document.getElementById("evolveId").value || 1;
    document.getElementById("statusEvolve").innerText = "Sending...";
    try {
      const c = new web3.eth.Contract(ABI.evolving, ADDR.evolving);
      const hash = await sendTx(c, "evolve", [id]);
      document.getElementById("statusEvolve").innerHTML = `✅ Sent — <a href="https://basescan.org/tx/${hash}" target="_blank">${hash.slice(0,10)}...</a>`;
    } catch (e) {
      document.getElementById("statusEvolve").innerText = "❌ " + (e.message || e);
    }
  },

  // OpinionRegistry
  addOpinion: async () => {
    const topicId = Number(document.getElementById("opinionTopic").value);
    const txt = document.getElementById("opinionText").value || "Nice!";
    if (!Number.isInteger(topicId)) {
      document.getElementById("statusOpinion").innerText = "Enter a topic ID (number)";
      return;
    }
    document.getElementById("statusOpinion").innerText = "Sending...";
    try {
      const c = new web3.eth.Contract(ABI.opinion, ADDR.opinion);
      const hash = await sendTx(c, "addOpinion", [topicId, txt]);
      document.getElementById("statusOpinion").innerHTML =
        `✅ Sent — <a href="https://basescan.org/tx/${hash}" target="_blank">${hash.slice(0,10)}...</a>`;
    } catch (e) {
      document.getElementById("statusOpinion").innerText = "❌ " + (e.message || e);
    }
  }
};
