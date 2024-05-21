"use client";

import { useEnokiFlow } from "@mysten/enoki/react";
import { useEffect, useState } from "react";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { useSuiClient } from "@mysten/dapp-kit";
import { getFaucetHost, requestSuiFromFaucetV0 } from '@mysten/sui.js/faucet';

export default function Home() {
  const client = useSuiClient();
  const enokiFlow = useEnokiFlow();
  const [session, setSession] = useState<any | null>(null);

  const [ suiAddress, setSuiAddress ] = useState<string | null>(null);
  const [ balance, setBalance ] = useState<number>(0);

  useEffect(() => {
    completeLogin();
  }, []);

  useEffect(() => {
    if (session) {
      getAccountInfo();
    }
  }, [session]);

  const completeLogin = async () => {
    try {
      const res = await enokiFlow.handleAuthCallback();
      console.log("res", res);
    } catch (error) {
      console.error("error", error);
    } finally {
      try {
        const session = await enokiFlow.getSession();
        console.log("session", session);
        setSession(session);
      } catch (error) {
        console.error("error", error);
      }
      // remove the URL fragment
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  const getAccountInfo = async () => {
    const keypair = await enokiFlow.getKeypair({ network: "testnet" });
    const address = keypair.toSuiAddress();
    setSuiAddress(address);

    const balance = await client.getBalance({ owner: address });
    setBalance(parseInt(balance.totalBalance) / 10 ** 9)
  };

  const onRequestSui = async () => {

    if (!suiAddress) {
      console.error('Login first to get SUI address.')
      return;
    }

    await requestSuiFromFaucetV0({
      host: getFaucetHost('testnet'),
      recipient: suiAddress,
    });

    console.log('SUI requested successfully.')
  };

  async function handleButtonClick() {
    // Get the keypair for the current user.
    const keypair = await enokiFlow.getKeypair({ network: "testnet" });

    const address = keypair.toSuiAddress();
    console.log("address", address);

    const txb = new TransactionBlock();

    // Add some transactions to the block...
    const [coin] = txb.splitCoins(txb.gas, [txb.pure(1)]);
    txb.transferObjects(
      [coin],
      txb.pure(
        "0x8e8cae7791a93778800b88b6a274de5c32a86484593568d38619c7ea71999654"
      )
    );

    // Sign and execute the transaction block, using the Enoki keypair
    const res = await client.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: txb,
    });
    console.log("res", res);
  }

  if (session) {
    return (
      <div className="flex flex-col items-center justify-start">
        <h1>Welcome!</h1>
        <p>
          Your address: {`${suiAddress?.slice(0, 5)}...${suiAddress?.slice(63)}`}
        </p>
        <p>
          Your SUI balance: {balance.toPrecision(3)} SUI <button onClick={getAccountInfo}>Refresh</button>
        </p>
        <button onClick={onRequestSui}>Request SUI</button>
        <button onClick={handleButtonClick}>Sign transaction</button>
        <button
          onClick={async () => {
            await enokiFlow.logout();
            window.location.reload();
          }}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start">
      <button
        onClick={async () => {
          window.location.href = await enokiFlow.createAuthorizationURL({
            provider: "google",
            clientId: process.env.GOOGLE_CLIENT_ID!,
            redirectUrl: window.location.href.split("#")[0],
            network: "testnet",
          });
        }}
      >
        Sign in with Google
      </button>
    </div>
  );
}
