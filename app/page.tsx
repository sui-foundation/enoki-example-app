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
import { USER_ROLES } from "@/constants/USER_ROLES";
import ProfilePopover from "@/components/ProfilePopover";

export default function Page() {

  return (
    <div className="w-full h-full min-h-screen p-2">
      <div className="w-full flex flex-row items-center justify-between">
        <h1 className="text-4xl font-bold m-4">Enoki Demo App</h1>
        <ProfilePopover />
      </div>
      <div className="flex flex-col items-center sm:flex-row gap-4 sm:items-start">
        
      </div>
    </div>
  );
}