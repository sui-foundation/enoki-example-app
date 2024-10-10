"use client";

import { useEffect, useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { useSuiClient } from "@mysten/dapp-kit";
import { useEnokiFlow, useZkLogin } from "@mysten/enoki/react";
import { getFaucetHost, requestSuiFromFaucetV0 } from "@mysten/sui/faucet";
import { ExternalLink, Github, LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BalanceChange } from "@mysten/sui/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { track } from "@vercel/analytics";
import { useCustomWallet } from "@/contexts/CustomWallet";
import ProfilePopover from "@/components/ProfilePopover";
import { CreateCounter } from "@/components/CreateCounter";
import { isValidSuiObjectId } from "@mysten/sui/utils";
import { Counter } from "@/components/Counter";

export default function Page() {

  const { isConnected } = useCustomWallet();
  const [counterId, setCounter] = useState(() => {
  	const hash = window.location.hash.slice(1);
  	return isValidSuiObjectId(hash) ? hash : null;
  });


  return (
    <div className="w-full h-full min-h-screen p-2">
      <div className="w-full flex flex-row items-center justify-between">
        <h1 className="text-4xl font-bold m-4">Enoki Demo App</h1>
        <ProfilePopover />
      </div>
      <div className="flex flex-col items-center sm:flex-row gap-4 sm:items-start">
        {
          isConnected ? (
            counterId ? (
  						<Counter id={counterId} />
  					) : (
  						<CreateCounter
  							onCreated={(id) => {
  								window.location.hash = id;
  								setCounter(id);
  							}}
  						/>
  					)
          ) : (
            <div>
              Please connect your wallet to continue.
            </div>
          )
        }
      </div>
    </div>
  );
}