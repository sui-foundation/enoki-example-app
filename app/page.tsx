"use client";

import { useEnokiFlow } from "@mysten/enoki/react";
import { useEffect, useState } from "react";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { useSuiClient } from "@mysten/dapp-kit";
import { getFaucetHost, requestSuiFromFaucetV0 } from "@mysten/sui.js/faucet";
import { ExternalLink, LoaderCircle, RefreshCw } from "lucide-react";

export default function Page() {
  const client = useSuiClient(); // The SuiClient instance
  const enokiFlow = useEnokiFlow(); // The EnokiFlow instance

  /**
   * The current user session, if any. This is used to determine whether the user is logged in or
   * not.
   */
  const [session, setSession] = useState<any | null>(null);

  /* The account information of the current user. */
  const [suiAddress, setSuiAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [accountLoading, setAccountLoading] = useState<boolean>(true);

  /* Transfer form state */
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>('');
  const [transferLoading, setTransferLoading] = useState<boolean>(false);
  const [transferDigest, setTransferDigest] = useState<string>("");

  /* Counter state */
  const [counter, setCounter] = useState<number>(0);
  const [counterLoading, setCounterLoading] = useState<boolean>(false);
  const [countLoading, setCountLoading] = useState<boolean>(false);
  const [counterDigest, setCounterDigest] = useState<string>("");

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
      getCount();
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
    setAccountLoading(true);

    const keypair = await enokiFlow.getKeypair({ network: "testnet" });
    const address = keypair.toSuiAddress();
    setSuiAddress(address);

    const balance = await client.getBalance({ owner: address });
    setBalance(parseInt(balance.totalBalance) / 10 ** 9);

    setAccountLoading(false);
  };

  /**
   * Request SUI from the faucet.
   */
  const onRequestSui = async () => {
    // Ensures the user is logged in and has a SUI address.
    if (!suiAddress) {
      console.error("Login first to get SUI address.");
      return;
    }

    // Request SUI from the faucet.
    await requestSuiFromFaucetV0({
      host: getFaucetHost("testnet"),
      recipient: suiAddress,
    });
  };

  /**
   * Transfer SUI to another account. This transaction is not sponsored by the app.
   */
  async function transferSui() {
    setTransferLoading(true);

    // Validate the transfer amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      setTransferDigest("Invalid amount");
      setTransferLoading(false);
      return;
    }
    

    // Get the keypair for the current user.
    const keypair = await enokiFlow.getKeypair({ network: "testnet" });

    // Create a new transaction block
    const txb = new TransactionBlock();

    // Add some transactions to the block...
    const [coin] = txb.splitCoins(txb.gas, [txb.pure(parsedAmount * 10 ** 9)]);
    txb.transferObjects(
      [coin],
      txb.pure(
        recipientAddress
      )
    );

    // Sign and execute the transaction block, using the Enoki keypair
    const res = await client.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: txb,
    });

    setTransferDigest(res.digest);
    setTransferLoading(false);
  }

  async function getCount() {
    setCountLoading(true);

    const res = await client.getObject({
      id: '0xd710735500fc1be7dc448b783ad1fb0b5fd209890a67e518cc47e7dc26856aa6',
      options: {
        showContent: true
      }
    }) as any;

    setCounter(res.data.content.fields.count as number)

    setCountLoading(false);
  }

  /**
   * Increment the global counter. This transaction is sponsored by the app.
   */
  async function incrementCounter() {
    setCounterLoading(true);

    // Create a new transaction block
    const txb = new TransactionBlock();

    // Add some transactions to the block...
    txb.moveCall({
      arguments: [
        txb.pure(
          "0xd710735500fc1be7dc448b783ad1fb0b5fd209890a67e518cc47e7dc26856aa6"
        ),
      ],
      target:
        "0x5794fff859ee70e28ec8a419f2a73830fb66bcaaaf76a68e41fcaf5e057d7bcc::global_counter::increment",
    });

    // Sponsor and execute the transaction block, using the Enoki keypair
    const res = await enokiFlow.sponsorAndExecuteTransactionBlock({
      transactionBlock: txb,
      network: "testnet",
      client,
    });

    setCounter(counter + 1);

    setCounterDigest(res.digest);
    setCounterLoading(false);
    
    getCount();
  }

  if (session) {
    return (
      <div className="flex flex-col items-start justify-start gap-4">
        <h1>Enoki Demo App</h1>
        <div className="flex flex-col items-start border px-4 py-1 absolute top-4 right-4 w-[260px]">
          <button className="relative top-0 right-0" onClick={getAccountInfo}><RefreshCw width={20} /></button>
          <span className="w-full text-center">Account Info</span>
          {
            accountLoading ? (
              <div className="w-full flex flex-col items-center">
                <LoaderCircle className="animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex flex-row gap-1 items-center">
                  <span>Your address:{" "}</span>
                  {
                    accountLoading ? (
                      <span>Loading...</span>
                    ) : (
                      <div className="flex flex-row gap-1">
                        <span>{`${suiAddress?.slice(0, 5)}...${suiAddress?.slice(63)}`}</span>
                        <a><ExternalLink width={12} /></a>
                      </div>
                    )
                  }
                </div>
                <div>
                  <span>Your balance:{" "}</span>
                  <span>{balance.toPrecision(3)} SUI</span>
                </div>
              </>
            )
          }
          <button
            className="w-full text-center"
            onClick={async () => {
              await enokiFlow.logout();
              window.location.reload();
            }}
          >
            Logout
          </button>
        </div>
        <button onClick={onRequestSui}>
          Request SUI
        </button>
        <div className="flex flex-col items-start border">
          <span className="w-full text-center">Transfer Transaction Example</span>  
          <div className="flex flex-row gap-2 items-center w-full justify-center">
            <input
              className="text-black"
              type="text"
              placeholder="Recipient address"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
            />
            <input
              className="text-black"
              type="text"
              placeholder="1.4"
              value={amount}
              onChange={(e) => setAmount(e.target.value as any)}
            />
          </div>
          <div className="w-full flex flex-row items-center justify-center">
            <button onClick={transferSui}>Transfer SUI</button>
            {
              transferLoading && <LoaderCircle className="animate-spin" />
            }
          </div>
          {
            transferDigest !== "" && (
              <div className="flex flex-row gap-2 items-center">
                <span>Transfer Digest: </span>
                <a>{transferDigest}</a>
              </div>
            )
          }
        </div>
        <div className="flex flex-col items-start border">
          <span className="w-full text-center">Sponsored Transaction Example</span>
          <div className="flex flex-row items-center gap-2">
            <span>Counter: </span>
            <span>
              {countLoading ? "Loading..." : counter}
            </span>
          </div>
          <div className="w-full flex flex-row items-center justify-center">
            <button onClick={incrementCounter}>Increment counter</button>
            {
              counterLoading && <LoaderCircle className="animate-spin" />
            }
          </div>
          {
            counterDigest !== "" && (
              <div className="flex flex-row gap-2 items-center">
                <span>Transaction Digest: </span>
                <a>{counterDigest}</a>
              </div>
            )
          }
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start">
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded top-4 right-4 absolute"
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
