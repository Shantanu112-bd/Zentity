> For the complete documentation index, see [llms.txt](https://docs.mstblockchain.com/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://docs.mstblockchain.com/developer-docs/foundation/introduction-of-evm-and-opcodes.md).

# Introduction of EVM & OpCodes

### EVM in MST Blockchain

The **Ethereum Virtual Machine (EVM)** is the decentralised execution environment that powers MST Blockchain. It ensures that smart contract code runs consistently, securely, and deterministically across all MST nodes. By adopting the EVM standard, MST Blockchain offers developers full compatibility with existing Ethereum-based tools and frameworks, while enhancing scalability and ecosystem-specific functionalities.

Nodes on MST execute smart contracts via the EVM, using **gas** as the unit of computational cost. This mechanism prevents abuse, ensures efficient resource allocation, and preserves the stability of the network.

***

### Prerequisites

To understand the EVM in MST Blockchain, familiarity with the following concepts is helpful:

* MST Blockchain fundamentals, such as [**accounts**](/developer-docs/foundation/accounts-on-mst-chain.md), [**transactions**](/developer-docs/foundation/transactions.md), and the [**MSTC**](/developer-docs/foundation/introduction-of-mstc.md)**,** along with [Hash Functions](https://en.wikipedia.org/wiki/Cryptographic_hash_function) & [Merkle Tree](https://wikipedia.org/wiki/Merkle_tree).

***

### From Ledger to State Machine

Blockchains, such as Bitcoin, are often described as distributed ledgers that record balances and enforce rules, including preventing overspending.

MST Blockchain extends this model with programmable logic through **smart contracts**. For this, it is more accurate to describe MST as a **distributed state machine**:

* The **state** includes accounts, balances, smart contracts, and storage.
* The **EVM** governs how this state changes with each new block.
* Arbitrary code execution becomes possible, enabling decentralised applications and industry-specific solutions.

***

### State Transition Function

The EVM in MST defines the **state transition function**:

**Y(S, T) → S'**

* **S** = the current valid state
* **T** = a set of valid transactions
* **S'** = the new valid state after execution

This deterministic behaviour ensures all MST nodes compute the same result for every transaction set.

***

### State

MST Blockchain maintains its global state in a **Modified Merkle Patricia Trie (MMPT)** — a cryptographic structure that links all accounts and contracts into a single root hash. This provides:

* Integrity and tamper resistance
* Efficient synchronisation across nodes
* Fast verification of transactions

***

### Transactions

Transactions are **signed instructions** that update the state. In MST Blockchain, there are two types:

1. **Message calls** → invoke functions or transfer MSTC
2. **Contract creation** → deploys new smart contracts with compiled bytecode

Once deployed, contracts can be called repeatedly, with the EVM executing their logic deterministically.

***

### EVM Execution

The EVM functions as a **stack machine** with 1024-depth, where each element is a **256-bit word** — chosen for cryptographic alignment with Keccak-256 and secp256k1.

* **Transient memory**: cleared after execution
* **Persistent storage**: maintained per contract in the state trie

Execution consists of **EVM opcodes**, including:

* **General operations**: ADD, SUB, AND, XOR
* **Blockchain-specific operations**: ADDRESS, BALANCE, BLOCKHASH

Each operation consumes **gas**, ensuring cost efficiency and discouraging wasteful computation.

***

### EVM Implementations

All MST Blockchain clients implement the **EVM** according to protocol specifications, ensuring deterministic and identical results across the network.

By being **EVM-compatible**, MST allows developers to seamlessly migrate or extend existing Ethereum-based dApps into the MST ecosystem without rewriting code from scratch.

***

### Why the EVM Matters for MST Blockchain

The EVM is the **engine of programmability** in the MST Blockchain. It enables:

* Deployment of dApps, DeFi protocols, NFTs, and enterprise applications
* Integration with MST’s native protocols like **SatvaShuffle** and **Klesthesia**
* Tokenised businesses, decentralised identity, and multi-industry blockchain adoption

### OpCodes

| Opcode (Hex)                     | Name                                                                                        | Description                                        | Gas Cost\*                      |
| -------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------- |
| **Core Arithmetic & Logic**      |                                                                                             |                                                    |                                 |
| 0x00                             | STOP                                                                                        | Halts execution                                    | 0                               |
| 0x01–0x09                        | ADD, MUL, SUB, DIV, SDIV, MOD, SMOD, ADDMOD, MULMOD                                         | Basic math ops                                     | 3–8                             |
| 0x0A                             | EXP                                                                                         | Exponentiation (dynamic gas)                       | 10 + 50 × (exponent bytes)      |
| 0x10–0x15                        | LT, GT, SLT, SGT, EQ, ISZERO                                                                | Comparison and zero-check                          | 3                               |
| 0x16–0x19                        | AND, OR, XOR, NOT                                                                           | Bitwise logic                                      | 3                               |
| 0x1A                             | BYTE                                                                                        | Extract a byte from word                           | 3                               |
| **Hashing & Crypto**             |                                                                                             |                                                    |                                 |
| 0x20                             | KECCAK256                                                                                   | Keccak-256 hash                                    | 30                              |
| **Environmental**                |                                                                                             |                                                    |                                 |
| 0x30–0x37                        | ADDRESS, BALANCE, CALLER, CALLVALUE, CALLDATALOAD, CALLDATASIZE, CALLDATACOPY               | Account and tx metadata ops                        | 2–3                             |
| 0x3A                             | GASPRICE                                                                                    | Current transaction’s gas price                    | 2                               |
| **Block Info**                   |                                                                                             |                                                    |                                 |
| 0x40–0x48                        | BLOCKHASH, COINBASE, TIMESTAMP, NUMBER, DIFFICULTY, GASLIMIT, CHAINID, SELFBALANCE, BASEFEE | Block and chain metadata                           | 2–20                            |
| **Stack & Memory**               |                                                                                             |                                                    |                                 |
| 0x50                             | POP                                                                                         | Remove top stack item                              | 2                               |
| 0x51                             | MLOAD                                                                                       | Load word from memory                              | 3                               |
| 0x52                             | MSTORE                                                                                      | Store word to memory                               | 3                               |
| 0x54                             | SLOAD                                                                                       | Load from persistent storage                       | 800 (or warm/cold pricing)      |
| 0x55                             | SSTORE                                                                                      | Store to persistent storage                        | 20,000+ (varies based on state) |
| **Flow Control**                 |                                                                                             |                                                    |                                 |
| 0x56–0x57                        | JUMP, JUMPI                                                                                 | Unconditional and conditional jumps                | 8 / 10                          |
| 0x5B                             | JUMPDEST                                                                                    | Valid jump target marker                           | 1                               |
| **Push / Dup / Swap**            |                                                                                             |                                                    |                                 |
| 0x60–0x7F                        | PUSH1–PUSH32                                                                                | Push N-byte immediate values to stack              | 3 each                          |
| 0x80–0x8F                        | DUP1–DUP16                                                                                  | Duplicate stack item                               | 3 each                          |
| 0x90–0x9F                        | SWAP1–SWAP16                                                                                | Swap stack items                                   | 3 each                          |
| **Logging**                      |                                                                                             |                                                    |                                 |
| 0xA0–0xA4                        | LOG0–LOG4                                                                                   | Event logging (0–4 topics)                         | 375 + 375 × topics              |
| **Contract Creation & Calls**    |                                                                                             |                                                    |                                 |
| 0xF0                             | CREATE                                                                                      | Deploy smart contract                              | \~32,000\*                      |
| 0xF1                             | CALL                                                                                        | External contract call                             | \~700 base + extras             |
| 0xF3                             | RETURN                                                                                      | Halt execution with return data                    | 0\*                             |
| 0xFD                             | REVERT                                                                                      | Halt execution and revert state                    | 0\*                             |
| 0xFF                             | SELFDESTRUCT                                                                                | Destroy contract and send funds                    | \~5,000\*                       |
| 0xF4                             | DELEGATECALL                                                                                | Call preserving `msg.sender`, for proxies          | \~100\*                         |
| 0xFA                             | STATICCALL                                                                                  | Read-only call disallowing writes                  | \~100\*                         |
| 0xF5                             | CREATE2                                                                                     | Deterministic contract creation                    | \~32,000\*                      |
| **Transient Storage (EIP-1153)** |                                                                                             |                                                    |                                 |
| 0x5C                             | TLOAD                                                                                       | Load from transient storage (per tx, auto-cleared) | \~100 gas (hot load)            |
| 0x5D                             | TSTORE                                                                                      | Store to transient storage (per tx, auto-cleared)  | \~100 gas (warm store)          |

\* Some gas estimates (\* ) are approximate and can vary under MST consensus and optimization rules (e.g., cold vs. warm access, refunds). For precise gas values, refer to MST’s Parlia-aligned configuration
