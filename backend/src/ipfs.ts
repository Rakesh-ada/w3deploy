import { PinataSDK } from "pinata-web3";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT || "mock-jwt",
  pinataGateway: process.env.PINATA_GATEWAY || "gateway.pinata.cloud"
});

/**
 * Upload JSON state data to IPFS (Used for our "database" storage)
 */
export async function pinJsonToIPFS(jsonBody: object, name?: string) {
  try {
    const upload = await pinata.upload.json(jsonBody, {
      metadata: { name: name || "w3deploy-state.json" },
    });
    return upload.IpfsHash;
  } catch (error) {
    console.error("Error pinning JSON to IPFS:", error);
    throw error;
  }
}

/**
 * Remove an existing pin
 */
export async function unpinFromIPFS(cid: string) {
  try {
    await pinata.unpin([cid]);
  } catch (error) {
    console.warn("Failed to unpin:", cid, error);
  }
}
