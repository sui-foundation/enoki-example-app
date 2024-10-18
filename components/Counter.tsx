import { useSuiClient, useSuiClientQuery } from "@mysten/dapp-kit";
import type { SuiObjectData } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { useEffect, useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { useIncrementCounterTransaction } from "@/hooks/useIncrementCounterTransaction";
import { useResetCounterTransaction } from "@/hooks/useResetCounterTransaction";
import { useCustomWallet } from "@/contexts/CustomWallet";

export function Counter({ id }: { id: string }) {
  const { address, isConnected } = useCustomWallet();
  const suiClient = useSuiClient();
  const { data, isPending, error, refetch } = useSuiClientQuery("getObject", {
    id,
    options: {
      showContent: true,
      showOwner: true,
    },
  });

  // refetch the data every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const [waitingForTxn, setWaitingForTxn] = useState("");

  const { handleExecute: handleIncrement } = useIncrementCounterTransaction();
  const { handleExecute: handleReset } = useResetCounterTransaction();

  const executeMoveCall = async (method: "increment" | "reset") => {
    setWaitingForTxn(method);

    const tx = new Transaction();

    if (method === "reset") {
      const resetTxn = await handleReset(id);
      suiClient
        .waitForTransaction({ digest: resetTxn.digest })
        .then(async () => {
          await refetch();
          setWaitingForTxn("");
        });
    } else {
      const incrementTxn = await handleIncrement(id);
      suiClient
        .waitForTransaction({ digest: incrementTxn.digest })
        .then(async () => {
          await refetch();
          setWaitingForTxn("");
        });
    }
  };

  if (isPending) return <span>Loading...</span>;

  if (error) return <span>Error: {error.message}</span>;

  if (!data.data) return <span>Not found</span>;

  const ownedByCurrentAccount = getCounterFields(data.data)?.owner === address;

  console.log("ownedByCurrentAccount", ownedByCurrentAccount);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Counter {id.slice(0,8)}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        <span>Count: {getCounterFields(data.data)?.value}</span>
        <div className="flex flex-row justify-around items-center gap-2">
          <Button
            onClick={() => executeMoveCall("increment")}
            disabled={waitingForTxn !== "" || !isConnected}
          >
            {waitingForTxn === "increment" ? (
              <ClipLoader size={20} />
            ) : (
              isConnected ? "Increment" : "Sign in to increment"
            )}
          </Button>
          {ownedByCurrentAccount ? (
            <Button
              onClick={() => executeMoveCall("reset")}
              disabled={waitingForTxn !== ""}
            >
              {waitingForTxn === "reset" ? <ClipLoader size={20} /> : "Reset"}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
function getCounterFields(data: SuiObjectData) {
  if (data.content?.dataType !== "moveObject") {
    return null;
  }

  return data.content.fields as { value: number; owner: string };
}
