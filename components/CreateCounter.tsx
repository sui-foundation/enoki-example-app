import { useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { useCreateCounterTransaction } from "@/hooks/useCreateCounterTransaction";
import { useCustomWallet } from "@/contexts/CustomWallet";

export function CreateCounter({
  onCreated,
}: {
  onCreated: (id: string) => void;
}) {
  const [waitingForTxn, setWaitingForTxn] = useState(false);
  const { isConnected } = useCustomWallet();

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
        disabled={waitingForTxn || !isConnected}
      >
        {waitingForTxn ? <ClipLoader size={20} /> : isConnected ? "Create Personal Counter" : "Sign in to increment"}
      </Button>
    </Card>
  );
}
