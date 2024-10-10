import clientConfig from "@/config/clientConfig";
import { useNetworkVariable } from "@/config/networkConfig";
import { useCustomWallet } from "@/contexts/CustomWallet";
import { SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";

export const useCreateCounterTransaction = () => {
  const { sponsorAndExecuteTransactionBlock, address } = useCustomWallet();
  const counterPackageId = useNetworkVariable("counterPackageId");


  const handleExecute = async (): Promise<SuiTransactionBlockResponse> => {
    const recipient = address!;

    console.log('recipient', recipient);

    const txb = new Transaction();

    txb.moveCall({
  		target: `0x7b6a8f5782e57cd948dc75ee098b73046a79282183d51eefb83d31ec95c312aa::counter::create`,
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
