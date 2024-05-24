"use client";

import { useEnokiFlow } from "@mysten/enoki/react";
import { useEffect, useState } from "react";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { useSuiClient } from "@mysten/dapp-kit";
import { getFaucetHost, requestSuiFromFaucetV0 } from "@mysten/sui.js/faucet";
import { ExternalLink, Github, LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner"
import { BalanceChange } from "@mysten/sui.js/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { track } from "@vercel/analytics"


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

  /* Counter state */
  const [counter, setCounter] = useState<number>(0);
  const [counterLoading, setCounterLoading] = useState<boolean>(false);
  const [countLoading, setCountLoading] = useState<boolean>(false);

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
      console.log("Session", session);

      if (session && session.jwt){
        setSession(session);
      }

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
    const promise = async () => {

      track("Request SUI");

      // Ensures the user is logged in and has a SUI address.
      if (!suiAddress) {
        throw new Error("No SUI address found");
      }

      if (balance > 3) {
        throw new Error("You already have enough SUI!");
      }

      // Request SUI from the faucet.
      const res = await requestSuiFromFaucetV0({
        host: getFaucetHost("testnet"),
        recipient: suiAddress,
      });

      if (res.error) {
        throw new Error(res.error);
      }

      return res;

    };
    
    toast.promise(promise, {
      loading: 'Requesting SUI...',
      success: (data) => {

        console.log("SUI requested successfully!", data)

        const suiBalanceChange = data.transferredGasObjects.map((faucetUpdate) => {
          return faucetUpdate.amount / 10 ** 9;
        }).reduce((acc: number, change: any) => {
          return acc + change;
        }, 0);

        setBalance( balance + suiBalanceChange );

        return 'SUI requested successfully! ';
      },
      error: (error) => {
        return error.message;
      },
    });
  };

  /**
   * Transfer SUI to another account. This transaction is not sponsored by the app.
   */
  async function transferSui() {
    const promise = async () => {

      track("Transfer SUI");

      setTransferLoading(true);

      // Validate the transfer amount
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount)) {
        setTransferLoading(false);
        throw new Error("Invalid amount");
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
        options: {
          showEffects: true,
          showBalanceChanges: true,
        },
      });

      setTransferLoading(false);

      console.log("Transfer response", res);

      if (res.effects?.status.status !== "success") {
        const suiBalanceChange = res.balanceChanges?.filter((balanceChange: BalanceChange) => {
          return balanceChange.coinType === "0x2::sui::SUI";
        }).map((balanceChange: BalanceChange) => {
          return parseInt(balanceChange.amount) / 10 ** 9;
        }).reduce((acc: number, change: any) => {
          if (change.coinType === "0x2::sui::SUI") {
            return acc + parseInt(change.amount);
          }
          return acc;
        }) || 0;
        setBalance( balance - suiBalanceChange );
        throw new Error("Transfer failed with status: " + res.effects?.status.error);
      }

      return res;
    }

    toast.promise(promise, {
      loading: 'Transfer SUI...',
      success: (data) => {

        const suiBalanceChange = data.balanceChanges?.filter((balanceChange: BalanceChange) => {
          return balanceChange.coinType === "0x2::sui::SUI";
        }).map((balanceChange: BalanceChange) => {
          return parseInt(balanceChange.amount) / 10 ** 9;
        }).reduce((acc: number, change: any) => {
          if (change.coinType === "0x2::sui::SUI") {
            return acc + parseInt(change.amount);
          }
          return acc;
        }) || 0;
        setBalance( balance - suiBalanceChange );

        return <span className="flex flex-row items-center gap-2">Transfer successful! <a href={`https://suiscan.xyz/testnet/tx/${data.digest}`} target='_blank'><ExternalLink width={12}/></a></span>;
      },
      error: (error) => {
        return error.message;
      },
    });
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

    const promise = async () => {

      track("Increment Counter");

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

      try {
        // Sponsor and execute the transaction block, using the Enoki keypair
        const res = await enokiFlow.sponsorAndExecuteTransactionBlock({
          transactionBlock: txb,
          network: "testnet",
          client,
        });
        setCounterLoading(false);

        return res;
      } catch (error) {
        setCounterLoading(false);
        throw error;
      }
    }

    toast.promise(promise, {
      loading: 'Incrementing counter...',
      success: (data) => {
        getCount();
        return <span className="flex flex-row items-center gap-2">Counter incremented! <a href={`https://suiscan.xyz/testnet/tx/${data.digest}`} target='_blank'><ExternalLink width={12}/></a></span>;
      },
      error: (error) => {
        return error.message;
      },
    });
  }

  if (session) {
    return (
      <div>
        <h1 className="text-4xl font-bold m-4">Enoki Demo App</h1>
        <Popover>
          <PopoverTrigger className="absolute top-4 right-4 max-w-sm" asChild>
            <div>
              <Button className="hidden sm:block" variant={'secondary'}>
                {
                  accountLoading ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    `${suiAddress?.slice(0, 5)}...${suiAddress?.slice(63)} - ${balance.toPrecision(3)} SUI`
                  )
                }
              </Button>
              <Avatar className="block sm:hidden">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </div>
          </PopoverTrigger>
          <PopoverContent>
            <Card className="border-none shadow-none">
            {/* <Button variant={'ghost'} size='icon' className="relative top-0 right-0" onClick={getAccountInfo}><RefreshCw width={16} /></Button> */}
              <CardHeader>
                <CardTitle>Account Info</CardTitle>
                <CardDescription>View the account generated by Enoki&apos;s zkLogin flow.</CardDescription>
              </CardHeader>
              <CardContent>
                {
                  accountLoading ? (
                    <div className="w-full flex flex-col items-center">
                      <LoaderCircle className="animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-row gap-1 items-center">
                        <span>Address:{" "}</span>
                        {
                          accountLoading ? (
                            <span>Loading...</span>
                          ) : (
                            <div className="flex flex-row gap-1">
                              <span>{`${suiAddress?.slice(0, 5)}...${suiAddress?.slice(63)}`}</span>
                              <a href={`https://suiscan.xyz/testnet/account/${suiAddress}`} target="_blank"><ExternalLink width={12} /></a>
                            </div>
                          )
                        }
                      </div>
                      <div>
                        <span>Balance:{" "}</span>
                        <span>{balance.toPrecision(3)} SUI</span>
                      </div>
                    </>
                  )
                }
              </CardContent>
              <CardFooter className="flex flex-row gap-2 items-center justify-between">
                <Button variant={'outline'} size={'sm'} onClick={onRequestSui}>
                  Request SUI
                </Button>
                <Button
                  variant={'destructive'}
                  size={'sm'}
                  className="w-full text-center"
                  onClick={async () => {
                    await enokiFlow.logout();
                    window.location.reload();
                  }}
                >
                  Logout
                </Button>
              </CardFooter>
            </Card>
          </PopoverContent>
        </Popover>
        <div className="flex flex-row  flex-wrap gap-4 items-start">
          <Card className="max-w-xs min-x-xs">
            <CardHeader>
              <CardTitle>Sponsored Transaction Example</CardTitle>
              <CardDescription>This transaction will be sponsored by Enoki and will not require you to pay gas! Try incrementing the counter with a balance of 0 SUI to test it out.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="flex flex-row items-center gap-2">
                <span>Counter: </span>
                <span>
                  {countLoading ? "Loading..." : counter}
                </span>
              </div>
            </CardContent>
            <CardFooter className="w-full flex flex-row items-center justify-center">
              <Button onClick={incrementCounter} disabled={counterLoading} className="w-full">Increment counter</Button>
            </CardFooter>
          </Card>

          <Card className="max-w-sm min-x-sm">
            <CardHeader>
              <CardTitle>Transfer Transaction Example</CardTitle>  
              <CardDescription>Transfer SUI to another account. This transaction is not sponsored by the app.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col w-full gap-2">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input 
                  type="text" 
                  id="recipient" 
                  placeholder="0xdeadbeef"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="amount">Transfer Amount (SUI)</Label>
                <Input 
                  type="text" 
                  id="amount" 
                  placeholder="1.4"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value as any)}
                />
              </div>
            </CardContent>
            <CardFooter className="w-full flex flex-row items-center justify-center">
              <Button className="w-full" onClick={transferSui} disabled={transferLoading}>Transfer SUI</Button>
            </CardFooter>
            
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start">
      <a href="https://github.com/dantheman8300/enoki-example-app" target="_blank" className="absolute top-4 right-0 sm:right-4" onClick={() => {track('github')}}><Button variant={'link'} size={'icon'}><Github /></Button></a>
      <h1 className="text-4xl font-bold m-4">Enoki Demo App</h1>
      <Button
        onClick={async () => {
          track("Sign in with Google");
          window.location.href = await enokiFlow.createAuthorizationURL({
            provider: "google",
            clientId: process.env.GOOGLE_CLIENT_ID!,
            redirectUrl: window.location.href.split("#")[0],
            network: "testnet",
          });
        }}
      >
        Sign in with Google
      </Button>
      
    </div>
  );
}
