// ✅ Ethers v5 imports
import { ethers } from "ethers";
import contractABI from "./abi/ContractABI.json";

const CONTRACT_ADDRESS = "0xYourContractAddressHere"; // Replace this

// ✅ Get provider (v5)
export const getProvider = async () => {
  if (!window.ethereum) throw new Error("MetaMask not detected");
  await window.ethereum.request({ method: "eth_requestAccounts" });
  return new ethers.providers.Web3Provider(window.ethereum);
};

// ✅ Get contract (v5)
export const getContract = async () => {
  const provider = await getProvider();
  const signer = provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
};

// ✅ Flag a wallet
export const flagWallet = async (wallet) => {
  const contract = await getContract();
  const tx = await contract.flagWallet(wallet);
  return tx;
};

// ✅ Get report count
export const getReportCount = async (wallet) => {
  const contract = await getContract();
  const count = await contract.getReportCount(wallet);
  return Number(count);
};
