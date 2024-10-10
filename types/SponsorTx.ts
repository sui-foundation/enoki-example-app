

export interface SponsorTxRequestBody {
  network: "mainnet" | "testnet";
  txBytes: string;
  sender: string;
  allowedAddresses?: string[];
}
