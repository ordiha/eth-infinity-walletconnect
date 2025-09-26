let web3;
let accounts = [];
let provider;

const CONTRACTS = {
  openMintNFT: { address: "0x79f6e18a8376b02b35C1D5C02DA86Ec03cA6d57d", abi: [{"inputs":[{"internalType":"string","name":"text","type":"string"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"}] },
  donationTracker: { address: "0x9dDAf52D93FE53715dC510190b2DDD1d1CafA8fB", abi: [{"inputs":[],"name":"donate","outputs":[],"stateMutability":"payable","type":"function"}] },
  lottery: { address: "0x2eDb3668A8c37a1b1D1934e4247da47FA2c73daf", abi: [{"inputs":[],"name":"buyTicket","outputs":[],"stateMutability":"payable","type":"function"}] },
  opinionRegistry: { address: "0xE74706982Be1c7223E5855EA42DCF96F1104215B", abi: [{"inputs":[{"internalType":"string","name":"opinion","type":"string"}],"name":"addOpinion","outputs":[],"stateMutability":"nonpayable","type":"function"}] },
  guessNumber: { address: "0xe5c4636C0249312fda74492a1a68094C1c08dA54", abi: [{"inputs":[{"internalType":"uint256","name":"num","type":"uint256"}],"name":"guess","outputs":[],"stateMutability":"nonpayable","type":"function"}] }
};

async function connectWallet() {
  provider = new WalletConnectProvider.default({
    projectId: "5056a2b581e5962f9e3083d68053b5d8"
  });

  await provider.enable();
  web3 = new Web3(provider);

  accounts = await web3.eth.getAccounts();
  document.getElementById("addr").innerText = accounts[0];
}

document.getElementById("btnConnect").onclick = connectWallet;

const actions = {
  mintOpen: async () => {
    const val = document.getElementById("openMintText").value;
    const contract = new web3.eth.Contract(CONTRACTS.openMintNFT.abi, CONTRACTS.openMintNFT.address);
    try {
      const tx = await contract.methods.mint(val).send({ from: accounts[0] });
      document.getElementById("statusOpen").innerText = "TX Success: " + tx.transactionHash;
    } catch (e) { document.getElementById("statusOpen").innerText = e.message; }
  },

  donate: async () => {
    const val = document.getElementById("donateEth").value;
    const contract = new web3.eth.Contract(CONTRACTS.donationTracker.abi, CONTRACTS.donationTracker.address);
    try {
      const tx = await contract.methods.donate().send({ from: accounts[0], value: web3.utils.toWei(val, "ether") });
      document.getElementById("statusDonate").innerText = "TX Success: " + tx.transactionHash;
    } catch (e) { document.getElementById("statusDonate").innerText = e.message; }
  },

  buyTicket: async () => {
    const val = document.getElementById("lotteryEth").value;
    const contract = new web3.eth.Contract(CONTRACTS.lottery.abi, CONTRACTS.lottery.address);
    try {
      const tx = await contract.methods.buyTicket().send({ from: accounts[0], value: web3.utils.toWei(val, "ether") });
      document.getElementById("statusLottery").innerText = "TX Success: " + tx.transactionHash;
    } catch (e) { document.getElementById("statusLottery").innerText = e.message; }
  },

  addOpinion: async () => {
    const val = document.getElementById("opinionText").value;
    const contract = new web3.eth.Contract(CONTRACTS.opinionRegistry.abi, CONTRACTS.opinionRegistry.address);
    try {
      const tx = await contract.methods.addOpinion(val).send({ from: accounts[0] });
      document.getElementById("statusOpinion").innerText = "TX Success: " + tx.transactionHash;
    } catch (e) { document.getElementById("statusOpinion").innerText = e.message; }
  },

  guessNumber: async () => {
    const val = document.getElementById("guessNumber").value;
    const contract = new web3.eth.Contract(CONTRACTS.guessNumber.abi, CONTRACTS.guessNumber.address);
    try {
      const tx = await contract.methods.guess(val).send({ from: accounts[0] });
      document.getElementById("statusGuess").innerText = "TX Success: " + tx.transactionHash;
    } catch (e) { document.getElementById("statusGuess").innerText = e.message; }
  }
};
