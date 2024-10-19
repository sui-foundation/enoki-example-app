"use client";

import { AuthenticationProvider } from "@/contexts/Authentication";
import { ChildrenProps } from "@/types/ChildrenProps";
import React from "react";
import { EnokiFlowProvider } from "@mysten/enoki/react";
import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { registerStashedWallet } from "@mysten/zksend";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import clientConfig from "@/config/clientConfig";
import "@mysten/dapp-kit/dist/index.css";
import CustomWalletProvider from "@/contexts/CustomWallet";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from '@vercel/analytics/react';


export interface StorageAdapter {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
}

const sessionStorageAdapter: StorageAdapter = {
  getItem: async (key) => {
    return sessionStorage.getItem(key);
  },
  setItem: async (key, value) => {
    sessionStorage.setItem(key, value);
  },
  removeItem: async (key) => {
    sessionStorage.removeItem(key);
  },
};

registerStashedWallet("Breaking the Ice - Community Vote", {});

export const ProvidersAndLayout = ({ children }: ChildrenProps) => {
  const { networkConfig } = createNetworkConfig({
    testnet: { url: getFullnodeUrl("testnet") },
    mainnet: { url: getFullnodeUrl("mainnet") },
  });

  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider
        networks={networkConfig}
        defaultNetwork={clientConfig.SUI_NETWORK_NAME}
      >
        <WalletProvider
          autoConnect
          stashedWallet={{
            name: "Breaking the Ice - Community Vote",
          }}
          storage={sessionStorageAdapter}
        >
          <EnokiFlowProvider apiKey={clientConfig.ENOKI_API_KEY}>
            <AuthenticationProvider>
              <CustomWalletProvider>
                <main>
                  {children}
                  <Toaster duration={2000} />
                  <Analytics />
                </main>
              </CustomWalletProvider>
            </AuthenticationProvider>
          </EnokiFlowProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
};
