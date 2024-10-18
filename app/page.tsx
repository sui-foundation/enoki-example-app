"use client";

import { useEffect, useState } from "react";
import { useCustomWallet } from "@/contexts/CustomWallet";
import ProfilePopover from "@/components/ProfilePopover";
import { CreateCounter } from "@/components/CreateCounter";
import { isValidSuiObjectId } from "@mysten/sui/utils";
import { Counter } from "@/components/Counter";
import { GithubIcon } from "lucide-react";
import clientConfig from "@/config/clientConfig";

export default function Page() {
  const { isConnected } = useCustomWallet();
  const [counterId, setCounter] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (isValidSuiObjectId(hash)) {
      setCounter(hash);
    }
  }, []);

  return (
    <div className="w-full h-full min-h-screen">
      <div className="w-full flex flex-row items-center justify-between border-b px-4">
        <h1 className="text-xl sm:text-4xl font-bold tracking-tight m-4">Enoki Demo App</h1>
        <div className="flex flex-row items-center gap-6">
          <ProfilePopover />
          <a href="https://github.com/sui-foundation/enoki-example-app" target="_blank" className="hover:cursor-pointer transform hover:scale-110 transition-transform"><GithubIcon size={24} /></a>
        </div>
      </div>
      <div className="w-full flex flex-col items-center gap-4 p-4">
          <Counter id={clientConfig.GLOBAL_COUNTER_ID} />
          {
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
          }
      </div>
    </div>
  );
}
