"use client";

import { useEnokiFlow } from "@mysten/enoki/react";
import { useEffect, useState } from "react";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { useSuiClient } from "@mysten/dapp-kit";
import { getFaucetHost, requestSuiFromFaucetV0 } from '@mysten/sui.js/faucet';

export default function Page() {

  const client = useSuiClient();    // The SuiClient instance  
  const enokiFlow = useEnokiFlow(); // The EnokiFlow instance
  
  /**
   * The current user session, if any. This is used to determine whether the user is logged in or 
   * not.
   */
  const [session, setSession] = useState<any | null>(null);

  /* The account information of the current user. */
  const [ suiAddress, setSuiAddress ] = useState<string | null>(null);
  const [ balance, setBalance ] = useState<number>(0);

  /**
   * When the page loads, complete the login flow.
  */
  useEffect(() => {
    completeLogin();
  }, []);

  /**
   * When the user logs in, fetch the account information.
  */
  useEffect(() => {
    if (session) {
      getAccountInfo();
    }
  }, [session]);

  /**
   * Complete the Enoki login flow after the user is redirected back to the app.
   */
  const completeLogin = async () => {
    try {
      await enokiFlow.handleAuthCallback();
    } catch (error) {
      console.error("Erro handling auth callback", error);
    } finally {
      // Fetch the session
      const session = await enokiFlow.getSession();
      setSession(session);

      // remove the URL fragment
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  /**
   * Fetch the account information of the current user.
  */
  const getAccountInfo = async () => {
    const keypair = await enokiFlow.getKeypair({ network: "testnet" });
    const address = keypair.toSuiAddress();
    setSuiAddress(address);

    const balance = await client.getBalance({ owner: address });
    setBalance(parseInt(balance.totalBalance) / 10 ** 9)
  };

  /**
   * Request SUI from the faucet.
  */
  const onRequestSui = async () => {
    // Ensures the user is logged in and has a SUI address.
    if (!suiAddress) {
      console.error('Login first to get SUI address.')
      return;
    }

    // Request SUI from the faucet.
    await requestSuiFromFaucetV0({
      host: getFaucetHost('testnet'),
      recipient: suiAddress,
    });
  };

  /**
   * Transfer SUI to another account. This transaction is not sponsored by the app. 
   */
  async function transferSui() {
    // Get the keypair for the current user.
    const keypair = await enokiFlow.getKeypair({ network: "testnet" });

    // Create a new transaction block
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
    await client.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: txb,
    });
  }

  /**
   * Increment the global counter. This transaction is sponsored by the app.
  */
  async function incrementCounter() {
    // Create a new transaction block
    const txb = new TransactionBlock();

    // Add some transactions to the block...
    txb.moveCall({
      arguments: [txb.pure('0xd710735500fc1be7dc448b783ad1fb0b5fd209890a67e518cc47e7dc26856aa6')],
      target: '0x5794fff859ee70e28ec8a419f2a73830fb66bcaaaf76a68e41fcaf5e057d7bcc::global_counter::increment'
    })

    // Sponsor and execute the transaction block, using the Enoki keypair
    await enokiFlow.sponsorAndExecuteTransactionBlock({
      transactionBlock: txb,
      network: 'testnet',
      client
    });
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
        <button onClick={onRequestSui} disabled={balance > .5}>Request SUI</button>
        <button onClick={transferSui}>Sign transaction</button>
        <button onClick={incrementCounter}>Increment counter</button>
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
