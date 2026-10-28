> For the complete documentation index, see [llms.txt](https://docs.mstblockchain.com/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://docs.mstblockchain.com/developer-docs/foundation/gas.md).

# Gas

## Gas in MST Blockchain

Gas is essential to the MST Blockchain network. It is the fuel that powers transactions and smart contract executions, in the same way that a car needs fuel to run. Every action on the network — from sending coins to deploying decentralized applications — consumes computational resources, and gas ensures these resources are fairly paid for.

***

### Prerequisites

Before diving into gas, we recommend reading:

* [Transactions ](/developer-docs/foundation/transactions.md)– to understand how actions are initiated on the MST Blockchain.
* [EVM & OpCodes](/developer-docs/foundation/introduction-of-evm-and-opcodes.md) – to understand how smart contracts and computations are executed.

***

### What is Gas?

Gas is a unit of measurement for the computational effort required to perform operations on MST Blockchain. Whether it’s a simple transfer of MSTC (the native coin) or the execution of a complex smart contract, each operation consumes gas.

Gas ensures that the network remains secure by:

* Preventing spam attacks (every action has a cost).
* Avoiding infinite loops in smart contracts (each computation step consumes gas).
* Incentivising validators to process transactions.

Every transaction specifies:

* **Gas limit** – the maximum gas a user is willing to spend.
* **Gas price** – how much MSTC the user is willing to pay per unit of gas.

The **transaction fee** is calculated as:

```
Gas Used × (Base Fee + Priority Fee)
```

***

### Gas Fees in MST Blockchain

Like Ethereum, MST Blockchain uses **EIP-1559-style fee mechanics** for predictable fees and stability. Gas fees are paid in **MSTC**, the native coin of the ecosystem.

#### 1. Base Fee

* A minimum fee set by the protocol.
* Burned (removed from circulation), reducing total MSTC supply.
* Adjusts automatically depending on network congestion.

For example, if a block is consistently full, the base fee increases by up to 12.5% per block. If blocks are underused, the base fee decreases.

#### 2. Priority Fee (Tip)

* A user-added tip paid directly to validators.
* Encourages faster transaction inclusion.
* Larger tips help prioritize transactions during congestion.

#### 3. Max Fee

* A user-defined maximum cap (`maxFeePerGas`).
* Protects users from overpaying in case network conditions change rapidly.
* If the final cost is less than the max fee, the unused portion is refunded.

***

### Example Transaction

Suppose **Jordan sends 1 MSTC** to Taylor:

* Transaction requires **21,000 gas units**.
* Base Fee = **10 gwei**.
* Jordan adds a Priority Fee = **2 gwei**.

**Calculation:**

```
21,000 × (10 + 2) = 252,000 gwei = 0.000252 MSTC
```

* Total Deducted from Jordan = **1.000252 MSTC**
* Taylor Receives = **1.0000 MSTC**
* Validator Earns = **0.000042 MSTC** (priority fee)
* Burned Supply = **0.00021 MSTC**

***

### Gas Limit

The **gas limit** defines the maximum amount of gas you’re willing to spend:

* A **standard MSTC transfer** requires **21,000 gas**.
* Smart contract interactions may require much higher limits.

If the transaction consumes less gas than the limit, the unused portion is refunded. If it consumes more than the limit, execution fails and all gas is consumed.

***

### Block Gas

* **Target Block Size**: 15 million gas.
* **Maximum Block Size**: 30 million gas.
* Protocol dynamically adjusts base fees to maintain balance.

This ensures stability while allowing temporary bursts in demand.

***

### Why Gas Fees Exist

Gas fees are fundamental to the MST Blockchain’s security and efficiency:

* Prevents spam and denial-of-service attacks.
* Ensures fair use of validator resources.
* Provides economic incentives for validators.
* Enables controlled growth of the MSTC economy (via base fee burns).

***

### Monitoring Gas Fees

MST Blockchain supports gas estimation tools and dashboards, allowing users to check live fee rates before sending transactions. Recommended tools include:

* MST Gas Tracker – real-time fee estimates.
* MST Block Explorer – view gas prices per block.
* MST Wallets – auto-suggest optimised gas fees.

***

### Initiatives to Reduce Gas Costs

MST Blockchain is designed with scalability in mind. Initiatives to reduce gas costs include:

* **Layer-2 Solutions** – rollups and sidechains for faster, cheaper transactions.
* **Optimised EVM Execution** – reducing computational overhead for smart contracts.
* **Sharding & Future Upgrades** – enabling parallel execution across the network.

***

### Key Takeaways

* Gas is the **fuel of the MST Blockchain**.
* Fees = **Gas Used × (Base Fee + Priority Fee)**.
* Base fees are burned, reducing supply over time.
* Priority fees go to validators as incentives.
* Gas ensures network security, fairness, and stability.
