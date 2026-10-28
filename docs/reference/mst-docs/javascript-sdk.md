> For the complete documentation index, see [llms.txt](https://docs.mstblockchain.com/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://docs.mstblockchain.com/developer-docs/foundation/mst-blockchain-sdks/javascript-sdk.md).

# JavaScript SDK

Build JavaScript and Node.js applications on MST Blockchain. The MST Blockchain JavaScript SDK provides clients, JSON-RPC providers, wallet signers, transaction tools, and smart contract deployment.

### Table of Contents

* Features
* Installation
* Quick Start
  * 1\. Initialize the Client
  * 2\. Generate a Random Wallet
  * 3\. Check Account Balance (via Provider)
  * 4\. Estimate Gas & Send Transactions
  * 5\. Deploy Contract & Get Address
* Core Modules
  * 1\. Client
  * 2\. Provider
  * 3\. Signer
  * 4\. Errors

### Features

The SDK supports core MST Blockchain development workflows:

* **Client orchestration**: A single entry point for JavaScript SDK features.
* **JSON-RPC provider**: Fetch block data, account state, and transaction receipts.
* **Wallet signing**: Use `ethers.js` for transaction signing and address management.
* **Balance utilities**: Check native-token balances through the MST Blockchain provider.

### Install the MST Blockchain JavaScript SDK

```bash
npm install @mstblockchain/mst-sdk
```

### JavaScript quick start

#### 1. Initialize an MST Blockchain client

```javascript
const { Client } = require('@mstblockchain/mst-sdk');

const rpcUrl = 'https://testnetrpc.mstblockchain.com';
const privateKey = '0x...'; 

const client = new Client(rpcUrl, privateKey);
```

#### 2. Generate a JavaScript wallet

```javascript
// Creates a new client with a fresh random private key
const client = Client.createRandom(rpcUrl);
console.log(`Generated Address: ${client.signer.address}`);
console.log(`Private Key: ${client.signer.getPrivateKey()}`);
```

#### 3. Check an account balance with the provider

```javascript
async function checkBalance() {
    const address = '0x...';
    // Access balance through the provider
    const balance = await client.provider.getBalance(address);
    console.log(`Address Balance: ${balance.toString()} wei`);
}
```

#### 4. Estimate gas and send blockchain transactions

```javascript
async function sendTx() {
    const toAddress = '0x...';
    const amount = '1000000000000000000'; // 1 TOKEN
    
    // 1. Estimate gas first
    const gasLimit = await client.signer.estimateGas("sendNative", [toAddress, amount]);
    console.log(`Estimated Gas: ${gasLimit}`);

    // 2. Send the transaction
    const txHash = await client.signer.sendNative(toAddress, amount);
    console.log(`Transaction Hash: ${txHash}`);
}
```

#### 5. Deploy a smart contract and get its address

```javascript
async function deployContract() {
    const abi = [...];
    const bytecode = "0x...";
    const args = ["InitialValue"];

    // 1. Start deployment
    const txHash = await client.signer.deploy(abi, bytecode, args);
    console.log(`Deployment Hash: ${txHash}`);

    // 2. Wait for it to be mined
    const receipt = await client.provider.waitForTransaction(txHash);

    // 3. Get the new contract address
    console.log(`Contract Deployed at: ${receipt.contractAddress}`);
}
```

### MST Blockchain SDK modules

#### 1. `Client`

The root container and primary JavaScript SDK entry point.

* `static createRandom(rpcUrl)`: Returns a new Client instance with a random signer.
* `provider`: Instance of `Provider`.
* `signer`: Instance of `Signer` (if privateKey provided).

#### 2. `Provider` (Read-only)

Access blockchain data through the JSON-RPC provider at `client.provider`.

* `getBlockNumber()`: Returns the latest block.
* `getBalance(address)`: Fetches raw balance.
* `getTransactionReceipt(hash)`: Fetches the receipt of a mined txn.
* `waitForTransaction(hash)`: Waits for a txn to be mined.
* `estimateGas(txObject)`: Estimates gas for a raw transaction object.

#### 3. `Signer` (Identity & Writing)

Sign and submit MST Blockchain transactions through `client.signer`.

* `static createRandom(provider)`: Generates a new random Signer attached to a provider.
* `getPrivateKey()`: Returns the private key of the current wallet.
* `estimateGas(method, args)`: Estimates gas for Signer methods (`sendNative`, `sendToken`, `deploy`).
* `sendTransaction(tx)`: Signs and broadcasts any transaction.
* `sendNative(to, amount)`: Shortcut for sending native tokens.
* `sendToken(tokenAddress, to, amount)`: Sends ERC20 tokens.
* `deploy(abi, bytecode, args?)`: Deploys smart contracts.
* `getAddress()`: Returns the signer's public address.

#### 4. `Errors`

Custom error classes for better debugging.

* `ProviderError`: Network or RPC issues.
* `TransactionError`: Validation or on-chain submission failures.
* `WalletError`: Private key or signer initialization issues.

Refer to NPM for more details: [@mstblockchain/mst-sdk](https://www.npmjs.com/package/@mstblockchain/mst-sdk?activeTab=readme)
