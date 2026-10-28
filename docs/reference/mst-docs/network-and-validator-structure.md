> For the complete documentation index, see [llms.txt](https://docs.mstblockchain.com/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://docs.mstblockchain.com/developer-docs/foundation/network-and-validator-structure.md).

# Network & Validator Structure

### Prerequisites <a href="#prerequisites" id="prerequisites"></a>

To help you better understand this page, we recommend you first read through our [introduction to MST Chain.](/developer-docs/foundation/introduction-of-mst-chain.md)

### MST Blockchain Networks

The MST Blockchain architecture provides two distinct operational environments designed to ensure both network integrity and a streamlined development process:

* **MST Mainnet** – The production-grade blockchain where economic activity, governance, and real-value MSTC transactions take place.
* **MST Testnet** – A protocol-compliant testing environment for validating applications, smart contracts, and protocol upgrades under conditions that replicate Mainnet behaviour.

These networks share identical protocol specifications but operate independently. Wallet addresses remain valid across both environments, though balances, transaction history, and deployed contracts are not transferable between them.

***

### MST Mainnet

The **MST Mainnet** is the live deployment of the MST Blockchain protocol. It is optimised for reliability, performance, and security, supporting:

* Production-grade decentralised applications (dApps)
* Real-value MSTC transactions and settlements
* Validator participation through the Mainnet consensus mechanism
* On-chain governance and ecosystem activity

Market valuations of MSTC are based solely on Mainnet supply and demand.

***

### MST Testnet

The **MST Testnet** mirrors Mainnet functionality in full, using the same consensus mechanism to ensure consistent execution behaviour.

It is designed for:

* Application and smart contract validation in a risk-free setting
* Testing protocol changes and upgrades prior to Mainnet rollout
* Validator operations testing under real protocol conditions

The primary difference from Mainnet is governance over validator participation. On Testnet, validators are **managed internally by the MST developer community**, ensuring a stable and controlled environment for ongoing testing.

**Key Attributes:**

* Protocol and consensus are identical to Mainnet
* Publicly accessible for contract deployment and interaction
* Test MSTC available via official faucets for development purposes only
* Deterministic performance for consistent test results

***

### Test MSTC Acquisition

Test MSTC is required for executing transactions and deploying contracts on the MST Testnet. While it carries no economic value, it functions exactly like Mainnet MSTC in terms of gas consumption and transaction processing.

Developers can obtain Test MSTC from official [**MST Faucets**](http://faucet.mstblockchain.com/) by providing a valid wallet address.

***

#### Development Best Practices

* Deploy and validate all contracts on Testnet before Mainnet launch
* Avoid reusing Mainnet private keys on Testnet to mitigate security risks
* Use Testnet to simulate end-to-end integrations, including UI, contract logic, and backend services

***

#### Network Comparison

| Attribute           | MST Mainnet                 | MST Testnet                      |
| ------------------- | --------------------------- | -------------------------------- |
| Purpose             | Production deployment       | Application & protocol testing   |
| Coin                | MSTC (economic value)       | Test MSTC (no economic value)    |
| Consensus           | Mainnet PoS                 | Similar to Mainnet               |
| Validator Set       | Public staking participants | MST-selected validator operators |
| Accessibility       | Open to all                 | Open to all                      |
| Contract Deployment | Production-ready            | Development and validation       |

### Validator Structure in MST Blockchain

Validators are the backbone of the MST Blockchain, responsible for proposing, validating, and finalizing blocks in accordance with the network’s consensus mechanism. MST uses the same validator architecture across both Mainnet and Testnet to maintain execution consistency.

#### Consensus Mechanism

MST Blockchain operates on a **Proof-of-Stake (PoS)**-based consensus model, where validator participation is determined by the amount of staked MSTC and adherence to protocol requirements.

***

### Mainnet Validator Structure

On Mainnet, validator participation is **open to all eligible stakers** who meet the network’s staking criteria.

* **Selection Process:** Validators are chosen based on stake-weighted random selection, ensuring decentralisation and fairness.
* **Responsibilities:**
  * Propose and validate blocks
  * Confirm transactions
  * Participate in governance proposals
* **Incentives:** Earn MSTC through block rewards and transaction fees for honest participation and uptime.
* **Slashing:** Misbehaviour such as double-signing or extended downtime can result in stake penalties.
