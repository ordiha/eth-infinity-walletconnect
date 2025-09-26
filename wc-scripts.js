// Replace with your WalletConnect Project ID
const projectId = "5056a2b581e5962f9e3083d68053b5d8";

// Contracts (short list for demo)
const contracts = {
  OpenMintNFT: "0x79f6e18a8376b02b35C1D5C02DA86Ec03cA6d57d",
  DonationTracker2: "0x9dDAf52D93FE53715dC510190b2DDD1d1CafA8fB",
  Lottery: "0x2eDb3668A8c37a1b1D1934e4247da47FA2c73daf",
  OpinionRegistry: "0xE74706982Be1c7223E5855EA42DCF96F1104215B",
  GuessNumber: "0xe5c4636C0249312fda74492A1a68094C1c08dA54"
};

// Minimal ABIs
const abis = {
  OpenMintNFT: [{"inputs":[{"internalType":"string","name":"text","type":"string"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"}],
  DonationTracker2: [{"inputs":[],"name":"donate","outputs":[],"stateMutability":"payable","type":"function"}],
  Lottery: [{"inputs":[],"name":"buyTicket","outputs":[],"stateMutability":"payable","type":"function"}],
  OpinionRegistry: [{"inputs":[{"internalType":"string","name":"opinion","type":"string"}],"name":"addOpinion","outputs":[],"stateMutability":"nonpayable","type":"function"}],
  GuessNumber: [{"inputs":[{"internalType":"uint256","name":"n","type":"uint256"}],"name":"guess","outputs":[],"stateMutability":"nonpayable","type":"function"}]
};

// 1. Setup Web3Modal
const { EthereumProvider, default: Web3Modal } = window["@web3modal/standalone"];

const provider = new Web3Modal({
  projectId,
  themeMode: "dark",
  chains: [8453], // Base mainnet chainId
});

let web3, accounts;

// 2. Connect wallet
document.getElementById("btnConnect").onclick = async () => {
  try {
    const wcProvider = await EthereumProvider.init({
      projectId,
      chains: [8453],
      showQrModal: true
    });
    await wcProvider.enable();
    web3 = new Web3(wcProvider);
    accounts = await web3.eth.getAccounts();
    document.getElementById("addr").innerText = accounts[0];
  } catch (err) {
    console.error("Connect error", err);
  }
};

// 3. Actions
const actions = {
  async mintOpen() {
    const text = document.getElementById("openMintText").value;
    const contract = new web3.eth.Contract(abis.OpenMintNFT, contracts.OpenMintNFT);
    contract.methods.mint(text).send({ from: accounts[0] })
      .on("transactionHash", h => logTx(h, "OpenMintNFT"));
  },
  async donate() {
    const eth = document.getElementById("donateEth").value;
    const wei = web3.utils.toWei(eth, "ether");
    const contract = new web3.eth.Contract(abis.DonationTracker2, contracts.DonationTracker2);
    contract.methods.donate().send({ from: accounts[0], value: wei })
      .on("transactionHash", h => logTx(h, "Donate"));
  },
  async buyTicket() {
    const eth = document.getElementById("lotteryEth").value;
    const wei = web3.utils.toWei(eth, "ether");
    const contract = new web3.eth.Contract(abis.Lottery, contracts.Lottery);
    contract.methods.buyTicket().send({ from: accounts[0], value: wei })
      .on("transactionHash", h => logTx(h, "Lottery"));
  },
  async addOpinion() {
    const text = document.getElementById("opinionText").value;
    const contract = new web3.eth.Contract(abis.OpinionRegistry, contracts.OpinionRegistry);
    contract.methods.addOpinion(text).send({ from: accounts[0] })
      .on("transactionHash", h => logTx(h, "OpinionRegistry"));
  },
  async guessNumber() {
    const n = document.getElementById("guessNumber").value;
    const contract = new web3.eth.Contract(abis.GuessNumber, contracts.GuessNumber);
    contract.methods.guess(n).send({ from: accounts[0] })
      .on("transactionHash", h => logTx(h, "GuessNumber"));
  }
};

function logTx(hash, label) {
  const div = document.getElementById("txLog");
  div.innerHTML += `<div>${label}: <a href="https://basescan.org/tx/${hash}" target="_blank">${hash}</a></div>`;
}
