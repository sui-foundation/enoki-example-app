import { Transaction } from "@mysten/sui/transactions";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useNetworkVariable } from '@/config/networkConfig';
import { useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { useCreateCounterTransaction } from "@/hooks/useCreateCounterTransaction";
import { set } from "zod";

export function CreateCounter({
  onCreated,
}: {
  onCreated: (id: string) => void;
}) {
  const counterPackageId = useNetworkVariable("counterPackageId");

  const [waitingForTxn, setWaitingForTxn] = useState(false);

  const { handleExecute } = useCreateCounterTransaction();

  async function create() {
  	setWaitingForTxn(true);
    
    const txn = await handleExecute();

    console.log("txn", txn);

    const objectId = txn.effects?.created?.[0]?.reference?.objectId;

    if (objectId) {
      onCreated(objectId);
    }

    setWaitingForTxn(false);

  }

  return (
  	<Card>
  		<Button
  			onClick={() => {
  				create();
  			}}
  			disabled={waitingForTxn}
  		>
  			{waitingForTxn ? <ClipLoader size={20} /> : "Create Counter"}
  		</Button>
  	</Card>
  );
}