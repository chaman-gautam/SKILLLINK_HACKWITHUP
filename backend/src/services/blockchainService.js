// src/services/blockchainService.js
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { ethers } from "ethers";

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.THIRDWEB_RPC_URL;
const CONTRACT_ADDRESS = process.env.THIRDWEB_CONTRACT_ADDRESS;

if (!PRIVATE_KEY || !RPC_URL || !CONTRACT_ADDRESS) {
  throw new Error("Blockchain env vars missing");
}

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Initialize thirdweb SDK with signer
const sdk = ThirdwebSDK.fromSigner(wallet);

export async function mintSkillPassport(toAddress, metadata) {
  // metadata: object with name, description, image or metadataUri depending on your contract
  const contract = await sdk.getContract(CONTRACT_ADDRESS);

  // If your contract is an ERC721 standard and uses mintTo
  try {
    // thirdweb v3+ uses contract.erc721.mint or contract.erc721.mintTo depending on contract
    if (contract.erc721) {
      // mint to the recipient with metadata object
      const tx = await contract.erc721.mintTo(toAddress, metadata);
      // return transaction receipt or result
      return tx;
    } else if (contract.call) {
      // fallback if custom contract interface
      const tx = await contract.call("mintTo", [toAddress, metadata]);
      return tx;
    } else {
      throw new Error("Contract does not expose erc721 interface");
    }
  } catch (err) {
    throw err;
  }
}
