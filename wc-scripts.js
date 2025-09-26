let web3;
let accounts;
let provider;

// Connect Wallet button
document.getElementById("btnConnect").addEventListener("click", async () => {
  try {
    // If MetaMask available
    if (window.ethereum) {
      provider = window.ethereum;
      await provider.request({ method: "eth_requestAccounts" });
      web3 = new Web3(provider);
      accounts = await web3.eth.getAccounts();
      showWallet(accounts[0]);
      return;
    }

    // WalletConnect fallback
    const WalletConnectProvider = window.WalletConnectProvider.default;
    provider = new WalletConnectProvider({
      infuraId: "5056a2b581e5962f9e3083d68053b5d8" // your WalletConnect project ID
    });

    await provider.enable();
    web3 = new Web3(provider);
    accounts = await web3.eth.getAccounts();
    showWallet(accounts[0]);

  } catch (err) {
    console.error(err);
    alert("Failed to connect wallet!");
  }
});

function showWallet(addr) {
  document.getElementById("addr").innerText = addr;
  document.getElementById("chain").innerText = "Connected";
}

// Example contract interactions
const actions = {
  async mintOpen() {
    try {
      const txt = document.getElementById("openMintText").value;
      const contract = new web3.eth.Contract([
        { "inputs":[{"internalType":"string","name":"_text","type":"string"}],
          "name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"
        }
      ], "0x79f6e18a8376b02b35C1D5C02DA86Ec03cA6d57d");

      const tx = await contract.methods.mint(txt).send({ from: accounts[0] });
      document.getElementById("statusOpen").innerText = `Tx: ${tx.transactionHash}`;
    } catch(e) {
      console.error(e);
      document.getElementById("statusOpen").innerText = `Error: ${e.message}`;
    }
  },

  async donate() {
    try {
      const val = document.getElementById("donateEth").value;
      const contract = new web3.eth.Contract([], "0x9dDAf52D93FE53715dC510190b2DDD1d1CafA8fB");
      const tx = await contract.methods.donate().send({ from: accounts[0], value: web3.utils.toWei(val, "ether") });
      document.getElementById("statusDonate").innerText = `Tx: ${tx.transactionHash}`;
    } catch(e) {
      console.error(e);
      document.getElementById("statusDonate").innerText = `Error: ${e.message}`;
    }
  },

  async buyTicket() {
    try {
      const val = document.getElementById("lotteryEth").value;
      const contract = new web3.eth.Contract([], "0x2eDb3668A8c37a1b1D1934e4247da47FA2c73daf");
      const tx = await contract.methods.buyTicket().send({ from: accounts[0], value: web3.utils.toWei(val, "ether") });
      document.getElementById("statusLottery").innerText = `Tx: ${tx.transactionHash}`;
    } catch(e) {
      console.error(e);
      document.getElementById("statusLottery").innerText = `Error: ${e.message}`;
    }
  },

  async addOpinion() {
    try {
      const txt = document.getElementById("opinionText").value;
      const contract = new web3.eth.Contract([
        { "inputs":[{"internalType":"string","name":"_opinion","type":"string"}],
          "name":"addOpinion","outputs":[],"stateMutability":"nonpayable","type":"function"
        }
      ], "0xE74706982Be1c7223E5855EA42DCF96F1104215B");

      const tx = await contract.methods.addOpinion(txt).send({ from: accounts[0] });
      document.getElementById("statusOpinion").innerText = `Tx: ${tx.transactionHash}`;
    } catch(e) {
      console.error(e);
      document.getElementById("statusOpinion").innerText = `Error: ${e.message}`;
    }
  },

  async guessNumber() {
    try {
      const num = document.getElementById("guessNumber").value;
      const contract = new web3.eth.Contract([
        { "inputs":[{"internalType":"uint256","name":"_guess","type":"uint256"}],
          "name":"guess","outputs":[],"stateMutability":"nonpayable","type":"function"
        }
      ], "0xe5c4636C0249312fda74492A1a68094C1c08dA54");

      const tx = await contract.methods.guess(num).send({ from: accounts[0] });
      document.getElementById("statusGuess").innerText = `Tx: ${tx.transactionHash}`;
    } catch(e) {
      console.error(e);
      document.getElementById("statusGuess").innerText = `Error: ${e.message}`;
    }
  }
};
