> For the complete documentation index, see [llms.txt](https://docs.mstblockchain.com/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://docs.mstblockchain.com/developer-docs/foundation/mst-blockchain-sdks/python-sdk.md).

# Python SDK

A modular and lightweight blockchain development kit for interacting with any MST-compatible network.

### Table of Contents

* [Features](https://pypi.org/project/mst-sdk-python/#user-content-features)
* [Installation](https://pypi.org/project/mst-sdk-python/#user-content-installation)
* [Quick Start](https://pypi.org/project/mst-sdk-python/#user-content-quick-start)
  * [1. Initialize the Client](https://pypi.org/project/mst-sdk-python/#user-content-1-initialize-the-client)
  * [2. Generate a Random Wallet](https://pypi.org/project/mst-sdk-python/#user-content-2-generate-a-random-wallet)
  * [3. Check Account Balance (via Provider)](https://pypi.org/project/mst-sdk-python/#user-content-3-check-account-balance-via-provider)
  * [4. Estimate Gas & Send Transactions](https://pypi.org/project/mst-sdk-python/#user-content-4-estimate-gas--send-transactions)
  * [5. Deploy Contract & Get Address](https://pypi.org/project/mst-sdk-python/#user-content-5-deploy-contract--get-address)
* [Networks](https://pypi.org/project/mst-sdk-python/#user-content-networks)
* [Core Modules](https://pypi.org/project/mst-sdk-python/#user-content-core-modules)
  * [1. Client](https://pypi.org/project/mst-sdk-python/#user-content-1-client)
  * [2. Provider](https://pypi.org/project/mst-sdk-python/#user-content-2-provider-read-only)
  * [3. Signer](https://pypi.org/project/mst-sdk-python/#user-content-3-signer-identity--writing)
  * [4. Errors](https://pypi.org/project/mst-sdk-python/#user-content-4-errors)

### Features

* **Client Orchestration**: Universal entry point for all SDK features.
* **Provider Management**: Simple JSON-RPC provider (via `web3.py`) for fetching block data and account state.
* **Secure Signing**: Integrated `Signer` using `eth-account` for secure transaction signing and address management.
* **Balances**: Built-in utilities for checking native token balances.
* **Network Selection**: Pick `"mainnet"` or `"testnet"` and the SDK resolves the correct RPC endpoint for you — no config files or env vars needed.

### Installation

```
pip install -r requirements.txt
```

For local development (so the `mst_blockchain_sdk` package resolves from `src/`), install it in editable mode:

```
pip install -e .
```

*(Recommended: do this inside a virtual environment — `python -m venv .venv` then activate it — before installing.)*

There is no `.env` file or environment configuration to set up. The network is selected by name at runtime, and the private key is passed directly wherever you construct a `Client` — both are plain user input, not config.

### Quick Start

#### 1. Initialize the Client <a href="#user-content-1-initialize-the-client" id="user-content-1-initialize-the-client"></a>

```
from mst_blockchain_sdk import Client

private_key = "0x..."

client = Client("testnet", private_key)   # or "mainnet"
```

#### 2. Generate a Random Wallet <a href="#user-content-2-generate-a-random-wallet" id="user-content-2-generate-a-random-wallet"></a>

```
# Creates a new client with a fresh random private key
client = Client.create_random("testnet")
print(f"Generated Address: {client.signer.address}")
print(f"Private Key: {client.signer.get_private_key()}")
```

#### 3. Check Account Balance (via Provider) <a href="#user-content-3-check-account-balance-via-provider" id="user-content-3-check-account-balance-via-provider"></a>

```
address = "0x..."
# Access balance through the provider
balance = client.provider.get_balance(address)
print(f"Address Balance: {balance} wei")
```

#### 4. Estimate Gas & Send Transactions <a href="#user-content-4-estimate-gas--send-transactions" id="user-content-4-estimate-gas--send-transactions"></a>

```
to_address = "0x..."
amount = "1000000000000000000"  # 1 TOKEN

# 1. Estimate gas first
gas_limit = client.signer.estimate_gas("sendNative", [to_address, amount])
print(f"Estimated Gas: {gas_limit}")

# 2. Send the transaction
tx_hash = client.signer.send_native(to_address, amount)
print(f"Transaction Hash: {tx_hash}")
```

#### 5. Deploy Contract & Get Address <a href="#user-content-5-deploy-contract--get-address" id="user-content-5-deploy-contract--get-address"></a>

```
abi = [...]
bytecode = "0x..."
args = ["InitialValue"]

# 1. Start deployment
tx_hash = client.signer.deploy(abi, bytecode, args)
print(f"Deployment Hash: {tx_hash}")

# 2. Wait for it to be mined
receipt = client.provider.wait_for_transaction(tx_hash)

# 3. Get the new contract address
print(f"Contract Deployed at: {receipt.contractAddress}")
```

### Networks <a href="#user-content-networks" id="user-content-networks"></a>

`Client` resolves its RPC endpoint from a network name (defined in `mst_blockchain_sdk.utils.constants.NETWORKS`):

| Network             | RPC URL                                |
| ------------------- | -------------------------------------- |
| `testnet` (default) | `https://testnetrpc.mstblockchain.com` |
| `mainnet`           | `https://mariorpc.mstblockchain.com/`  |

```
from mst_blockchain_sdk import Client

testnet_client = Client("testnet", private_key)
mainnet_client = Client("mainnet", private_key)
```

Passing an unrecognized network name raises a `ValueError`.

### Core Modules <a href="#user-content-core-modules" id="user-content-core-modules"></a>

#### 1. `Client` <a href="#user-content-1-client" id="user-content-1-client"></a>

The root container and main entry point.

* `Client(network="testnet", private_key=None)`: Resolves the RPC URL for `network` and constructs the `Provider`/`Signer`.
* `Client.create_random(network="testnet")`: Returns a new `Client` instance with a random signer.
* `provider`: Instance of `Provider`.
* `signer`: Instance of `Signer` (if `private_key` provided).

#### 2. `Provider` (Read-only) <a href="#user-content-2-provider-read-only" id="user-content-2-provider-read-only"></a>

Accessed via `client.provider`.

* `get_block_number()`: Returns the latest block.
* `get_balance(address)`: Fetches raw balance.
* `get_transaction_receipt(tx_hash)`: Fetches the receipt of a mined txn.
* `wait_for_transaction(tx_hash)`: Waits for a txn to be mined.
* `estimate_gas(transaction)`: Estimates gas for a raw transaction object.

#### 3. `Signer` (Identity & Writing) <a href="#user-content-3-signer-identity--writing" id="user-content-3-signer-identity--writing"></a>

Accessed via `client.signer`.

* `Signer.create_random(provider)`: Generates a new random `Signer` attached to a provider.
* `get_private_key()`: Returns the private key of the current wallet.
* `estimate_gas(method, args)`: Estimates gas for Signer methods (`sendNative`, `sendToken`, `deploy`).
* `send_transaction(tx)`: Signs and broadcasts any transaction.
* `send_native(to, amount)`: Shortcut for sending native tokens.
* `send_token(token_address, to, amount)`: Sends ERC20 tokens.
* `deploy(abi, bytecode, args=None)`: Deploys smart contracts.
* `get_address()`: Returns the signer's public address.

#### 4. `Errors` <a href="#user-content-4-errors" id="user-content-4-errors"></a>

Custom error classes for better debugging (`mst_blockchain_sdk.Errors`).

* `ProviderError`: Network or RPC issues.
* `TransactionError`: Validation or on-chain submission failures.
* `WalletError`: Private key or signer initialization issues.

Refer to PyPi for more details: <https://pypi.org/project/mst-sdk-python/>
