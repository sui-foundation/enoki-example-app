import clientConfig from "@/config/clientConfig";
import { useCustomWallet } from "@/contexts/CustomWallet";
import { SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import toast from "react-hot-toast";

export const useVoteTransaction = () => {
  const { sponsorAndExecuteTransactionBlock, address, getAddressSeed } = useCustomWallet();

  const handleExecute = async (projectIds: number[]): Promise<SuiTransactionBlockResponse> => {
    const recipient = address!;
    const txb = new Transaction();
    const votingProjectIds = txb.makeMoveVec({
      elements: projectIds.map((projectId) => {
        let u64 = txb.pure.u64(projectId.toString());
        return u64;
      }),
      type: "u64",
    });

    const addressSeed = await getAddressSeed();

    txb.moveCall({
      target: `${clientConfig.VOTING_MODULE_ADDRESS}::voting::vote`,
      arguments: [
        votingProjectIds,
        txb.object(clientConfig.VOTES_OBJECT_ADDRESS),
        txb.pure.u256(addressSeed),
      ],
    });
    return await sponsorAndExecuteTransactionBlock({
      tx: txb,
      network: clientConfig.SUI_NETWORK_NAME,
      includesTransferTx: true,
      allowedAddresses: [recipient],
      options: {
        showEffects: true,
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
