import clientConfig from "@/config/clientConfig";
import { useCustomWallet } from "@/contexts/CustomWallet";
import { SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";

export const useIncrementCounterTransaction = () => {
  const { sponsorAndExecuteTransactionBlock, address } = useCustomWallet();

  const handleExecute = async (
    id: string
  ): Promise<SuiTransactionBlockResponse> => {
    const recipient = address!;

    const txb = new Transaction();

    txb.moveCall({
      arguments: [txb.object(id)],
      target: `${clientConfig.PACKAGE_ID}::counter::increment`,
    });

    return await sponsorAndExecuteTransactionBlock({
      tx: txb,
      network: clientConfig.SUI_NETWORK_NAME,
      includesTransferTx: true,
      allowedAddresses: [recipient],
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    })
      .then((resp) => {
        console.log(resp);
        return resp;
      })
      .catch((err) => {
        console.log(err);
        throw err;
      });
  };

  return { handleExecute };
};
