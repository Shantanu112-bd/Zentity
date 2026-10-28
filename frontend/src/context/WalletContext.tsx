import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  defineChain,
  parseAbi,
  decodeEventLog,
} from "viem";

export interface NetworkInfo {
  id: string;
  name: string;
  chainId: number;
  rpcUrl: string;
  symbol: string;
  explorerUrl?: string;
  label?: string;
}

export interface ContractInfo {
  PramaanRegistry: { address: `0x${string}` };
  PramaanVerifier: { address: `0x${string}` };
  PrecompileProbe?: { address: `0x${string}` };
}

export interface TxResult {
  txHash: string;
  blockNumber: bigint;
  gasUsed: bigint;
  status: "success" | "reverted";
  explorerUrl?: string;
  eventDecoded?: {
    scopeId: bigint;
    nullifier: bigint;
    recipient: string;
  };
}

interface WalletContextType {
  address: `0x${string}` | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  isCorrectNetwork: boolean;
  targetNetwork: NetworkInfo;
  contracts: ContractInfo | null;
  isAuthenticated: boolean;
  authAddress: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
  signIn: () => Promise<boolean>;
  submitProofToMST: (
    a: [string, string],
    b: [[string, string], [string, string]],
    c: [string, string],
    pubSignals: string[]
  ) => Promise<TxResult>;
}

const DEFAULT_CORAL: NetworkInfo = {
  id: "mstCoralTestnet",
  name: "MST Coral Testnet",
  chainId: 54635,
  rpcUrl: "https://coralrpc.mstblockchain.com",
  symbol: "tMSTC",
  explorerUrl: "https://coral.mstscan.com",
  label: "CORAL TESTNET",
};

const PRAMAAN_REGISTRY_ABI = parseAbi([
  "function verifyAndRecord(uint256[2] calldata a, uint256[2][2] calldata b, uint256[2] calldata c, uint256[7] calldata input) external returns (bool)",
  "function isNullifierSpent(uint256 scopeId, uint256 nullifier) external view returns (bool)",
  "function registeredIssuers(uint256 issuerKeyHash) external view returns (bool)",
  "event ProofVerifiedAndRecorded(uint256 indexed scopeId, uint256 indexed nullifier, address indexed recipient)",
]);

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [targetNetwork, setTargetNetwork] = useState<NetworkInfo>(DEFAULT_CORAL);
  const [contracts, setContracts] = useState<ContractInfo | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authAddress, setAuthAddress] = useState<string | null>(null);

  // Fetch contract info & active network from server
  useEffect(() => {
    fetch("/api/registry/info")
      .then((res) => res.json())
      .then((data) => {
        if (data.network) {
          setTargetNetwork({
            id: data.network.id,
            name: data.network.name,
            chainId: data.network.chainId,
            rpcUrl: data.network.rpcUrl,
            symbol: data.network.symbol,
            explorerUrl: data.network.explorerUrl,
            label: data.network.id === "mstCoralTestnet" ? "CORAL TESTNET" : data.network.id === "mstLegacyTestnet" ? "LEGACY TESTNET" : "LOCAL EVM",
          });
        }
        if (data.contracts) {
          setContracts(data.contracts);
        }
      })
      .catch(() => {});
  }, []);

  // Listen to Ethereum provider events
  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAddress(accounts[0] as `0x${string}`);
      } else {
        setAddress(null);
        setIsAuthenticated(false);
      }
    };

    const handleChainChanged = (chainHex: string) => {
      setChainId(parseInt(chainHex, 16));
    };

    eth.request({ method: "eth_accounts" }).then(handleAccountsChanged).catch(() => {});
    eth.request({ method: "eth_chainId" }).then(handleChainChanged).catch(() => {});

    eth.on?.("accountsChanged", handleAccountsChanged);
    eth.on?.("chainChanged", handleChainChanged);

    return () => {
      eth.removeListener?.("accountsChanged", handleAccountsChanged);
      eth.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  const isConnected = Boolean(address);
  const isCorrectNetwork = chainId === targetNetwork.chainId;

  const connect = async () => {
    const eth = (window as any).ethereum;
    if (!eth) {
      alert("No Ethereum wallet found. Please install MetaMask to submit transactions to MST.");
      return;
    }
    setIsConnecting(true);
    try {
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      if (accounts && accounts[0]) {
        setAddress(accounts[0] as `0x${string}`);
      }
      const cId = await eth.request({ method: "eth_chainId" });
      setChainId(parseInt(cId, 16));
    } catch (err: any) {
      console.error("Wallet connection failed:", err);
      alert(`Connection failed: ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setIsAuthenticated(false);
    setAuthAddress(null);
  };

  const switchNetwork = async () => {
    const eth = (window as any).ethereum;
    if (!eth) return;

    const targetChainHex = `0x${targetNetwork.chainId.toString(16)}`;
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetChainHex }],
      });
    } catch (switchError: any) {
      // Error code 4902 indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902 || switchError.data?.originalError?.code === 4902) {
        try {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: targetChainHex,
                chainName: targetNetwork.name,
                nativeCurrency: {
                  name: targetNetwork.symbol,
                  symbol: targetNetwork.symbol,
                  decimals: 18,
                },
                rpcUrls: [targetNetwork.rpcUrl],
                blockExplorerUrls: targetNetwork.explorerUrl ? [targetNetwork.explorerUrl] : undefined,
              },
            ],
          });
        } catch (addError: any) {
          console.error("Failed to add network:", addError);
          alert(`Failed to add network: ${addError.message}`);
        }
      } else {
        console.error("Failed to switch network:", switchError);
        alert(`Failed to switch network: ${switchError.message}`);
      }
    }
  };

  const signIn = async (): Promise<boolean> => {
    if (!address) {
      await connect();
      return false;
    }
    const eth = (window as any).ethereum;
    if (!eth) return false;

    try {
      // 1. Get nonce from server
      const nonceRes = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, origin: window.location.origin }),
      });
      const nonceData = await nonceRes.json();
      if (!nonceRes.ok) throw new Error(nonceData.message || "Failed to get nonce");

      // 2. Request user to sign message (EIP-191 personal_sign)
      const walletClient = createWalletClient({
        account: address,
        transport: custom(eth),
      });

      const signature = await walletClient.signMessage({
        message: nonceData.message,
      });

      // 3. Verify signature on server
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          nonce: nonceData.nonce,
          signature,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.message || "Signature verification failed");

      setIsAuthenticated(true);
      setAuthAddress(address);
      return true;
    } catch (err: any) {
      console.error("Sign-in challenge failed:", err);
      alert(`Sign in failed: ${err.message}`);
      return false;
    }
  };

  const submitProofToMST = async (
    a: [string, string],
    b: [[string, string], [string, string]],
    c: [string, string],
    pubSignals: string[]
  ): Promise<TxResult> => {
    const eth = (window as any).ethereum;
    if (!eth || !address) {
      throw new Error("Wallet not connected. Connect your wallet to submit on-chain.");
    }

    if (!isCorrectNetwork) {
      throw new Error(`Wrong network! Please switch wallet to ${targetNetwork.name} (${targetNetwork.chainId}).`);
    }

    const registryAddress = contracts?.PramaanRegistry?.address;
    if (!registryAddress) {
      throw new Error("PramaanRegistry contract address not loaded.");
    }

    const customChain = defineChain({
      id: targetNetwork.chainId,
      name: targetNetwork.name,
      nativeCurrency: { name: targetNetwork.symbol, symbol: targetNetwork.symbol, decimals: 18 },
      rpcUrls: { default: { http: [targetNetwork.rpcUrl] } },
      blockExplorers: targetNetwork.explorerUrl ? { default: { name: "Explorer", url: targetNetwork.explorerUrl } } : undefined,
    });

    const walletClient = createWalletClient({
      chain: customChain,
      account: address,
      transport: custom(eth),
    });

    const publicClient = createPublicClient({
      chain: customChain,
      transport: custom(eth),
    });

    // Format calldata arguments as BigInt
    const pA: [bigint, bigint] = [BigInt(a[0]), BigInt(a[1])];
    const pB: [[bigint, bigint], [bigint, bigint]] = [
      [BigInt(b[0][0]), BigInt(b[0][1])],
      [BigInt(b[1][0]), BigInt(b[1][1])],
    ];
    const pC: [bigint, bigint] = [BigInt(c[0]), BigInt(c[1])];
    const inputs: [bigint, bigint, bigint, bigint, bigint, bigint, bigint] = [
      BigInt(pubSignals[0]),
      BigInt(pubSignals[1]),
      BigInt(pubSignals[2]),
      BigInt(pubSignals[3]),
      BigInt(pubSignals[4]),
      BigInt(pubSignals[5]),
      BigInt(pubSignals[6]),
    ];

    // Submit transaction
    const txHash = await walletClient.writeContract({
      address: registryAddress,
      abi: PRAMAAN_REGISTRY_ABI,
      functionName: "verifyAndRecord",
      args: [pA, pB, pC, inputs],
    });

    // Wait for receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    let eventDecoded: any = null;
    if (receipt.logs && receipt.logs.length > 0) {
      try {
        const decoded = decodeEventLog({
          abi: PRAMAAN_REGISTRY_ABI,
          data: receipt.logs[0].data,
          topics: receipt.logs[0].topics,
        });
        if (decoded.eventName === "ProofVerifiedAndRecorded") {
          eventDecoded = decoded.args;
        }
      } catch (logErr) {
        console.warn("Could not decode event log:", logErr);
      }
    }

    const explorerUrl = targetNetwork.explorerUrl ? `${targetNetwork.explorerUrl}/tx/${txHash}` : undefined;

    return {
      txHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
      status: receipt.status === "success" ? "success" : "reverted",
      explorerUrl,
      eventDecoded,
    };
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        chainId,
        isConnected,
        isConnecting,
        isCorrectNetwork,
        targetNetwork,
        contracts,
        isAuthenticated,
        authAddress,
        connect,
        disconnect,
        switchNetwork,
        signIn,
        submitProofToMST,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
