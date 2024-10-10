import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import {
  SuiTransactionBlockResponse,
  SuiTransactionBlockResponseOptions,
} from "@mysten/sui/client";
import { useCurrentAccount, useCurrentWallet, useDisconnectWallet, useSignTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useEnokiFlow, useZkLogin, useZkLoginSession } from "@mysten/enoki/react";
import clientConfig from "@/config/clientConfig";
import { useRouter } from "next/navigation";
import { SponsorTxRequestBody } from "@/types/SponsorTx";
import { fromB64, toB64 } from "@mysten/sui/utils";
import axios, { AxiosResponse } from "axios";
import { useAuthentication } from "./Authentication";
import { UserRole } from "@/types/Authentication";
import { jwtDecode } from "jwt-decode";

export interface CreateSponsoredTransactionApiResponse {
  bytes: string;
  digest: string;
}

export interface ExecuteSponsoredTransactionApiInput {
  digest: string;
  signature: string;
}


interface SponsorAndExecuteTransactionBlockProps {
  tx: Transaction;
  network: "mainnet" | "testnet";
  options: SuiTransactionBlockResponseOptions;
  includesTransferTx: boolean;
  allowedAddresses?: string[];
}

interface ExecuteTransactionBlockWithoutSponsorshipProps {
  tx: Transaction;
  options: SuiTransactionBlockResponseOptions;
}
interface CustomWalletContextProps {
  isConnected: boolean;
  isUsingEnoki: boolean;
  address?: string;
  jwt?: string;
  emailAddress: string | null;
  getAddressSeed: () => Promise<string>;
  sponsorAndExecuteTransactionBlock: (
    props: SponsorAndExecuteTransactionBlockProps
  ) => Promise<SuiTransactionBlockResponse>;
  executeTransactionBlockWithoutSponsorship: (
    props: ExecuteTransactionBlockWithoutSponsorshipProps
  ) => Promise<SuiTransactionBlockResponse | void>;
  logout: () => void;
  redirectToAuthUrl: () => void;
}

export const useCustomWallet = () => {
  const context = useContext(CustomWalletContext);
  return context;
};

export const CustomWalletContext = createContext<CustomWalletContextProps>({
  isConnected: false,
  isUsingEnoki: false,
  address: undefined,
  jwt: undefined,
  emailAddress: null,
  getAddressSeed: async () => "",
  sponsorAndExecuteTransactionBlock: async () => {
    throw new Error("Not implemented");
  },
  executeTransactionBlockWithoutSponsorship: async () => {},
  logout: () => {},
  redirectToAuthUrl: () => {},
});

export default function CustomWalletProvider({children}: {children: React.ReactNode}) {
  const suiClient = useSuiClient();
  const router = useRouter();
  const { address: enokiAddress } = useZkLogin();
  const zkLoginSession = useZkLoginSession();
  const enokiFlow = useEnokiFlow();
  const { handleLoginAs } = useAuthentication();

  const currentAccount = useCurrentAccount();
  const { isConnected: isWalletConnected } = useCurrentWallet();
  const { mutateAsync: signTransactionBlock } = useSignTransaction();
  const { mutate: disconnect } = useDisconnectWallet();

  const [emailAddress, setEmailAddress] = useState<string | null>(null);

  const { isConnected, isUsingEnoki, address, logout } = useMemo(() => {
    return {
      isConnected: !!enokiAddress || isWalletConnected,
      isUsingEnoki: !!enokiAddress,
      address: enokiAddress || currentAccount?.address,
      logout: () => {
        if (isUsingEnoki) {
          enokiFlow.logout();     
        } else {
          disconnect();
        }
        sessionStorage.clear();
      },
    };
  }, [
    enokiAddress,
    currentAccount?.address,
    enokiFlow,
    isWalletConnected,
    disconnect,
  ]);

  useEffect(() => {
    console.log('isWalletConnected', isWalletConnected)
    console.log('isConnected', isConnected)
    console.log('zkLoginSession', zkLoginSession)
    if (isConnected && zkLoginSession && zkLoginSession.jwt) {
      const token = zkLoginSession.jwt;
      const decoded = jwtDecode(token);

      setEmailAddress((decoded as any).email);

      handleLoginAs({
        firstName: "Wallet",
        lastName: "User",
        role:
          sessionStorage.getItem("userRole") !== "null"
            ? (sessionStorage.getItem("userRole") as UserRole)
            : "anonymous",
        email: (decoded as any).email,
        picture: "",
      });  
    }
  }, [isConnected, isWalletConnected, handleLoginAs, zkLoginSession]);

  const getAddressSeed = async (): Promise<string> => {
    if (isUsingEnoki) {
      const { addressSeed } = await enokiFlow.getProof({
        network: clientConfig.SUI_NETWORK_NAME,
      });
      return addressSeed;
    }
    return "";
  };

  const redirectToAuthUrl = () => {
    router.push("/auth");

    const protocol = window.location.protocol;
    const host = window.location.host;
    const customRedirectUri = `${protocol}//${host}/auth`;
    enokiFlow
      .createAuthorizationURL({
        provider: "google",
        network: clientConfig.SUI_NETWORK_NAME,
        clientId: clientConfig.GOOGLE_CLIENT_ID,
        redirectUrl: customRedirectUri,
        extraParams: {
          scope: ["openid", "email", "profile",],
        },
      })
      .then((url) => {
        // sessionStorage.setItem("userRole", userRole);
        router.push(url);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const signTransaction = async (bytes: Uint8Array): Promise<string> => {
    if (isUsingEnoki) {
      const signer = await enokiFlow.getKeypair({
        network: clientConfig.SUI_NETWORK_NAME,
      });
      const signature = await signer.signTransaction(bytes);
      return signature.signature;
    }
    const txBlock = Transaction.from(bytes);
    return signTransactionBlock({
      transaction: txBlock,
      chain: `sui:${clientConfig.SUI_NETWORK_NAME}`,
    }).then((resp) => resp.signature);
  };

  const sponsorAndExecuteTransactionBlock = async ({
    tx,
    network,
    options,
    includesTransferTx,
    allowedAddresses = [],
  }: SponsorAndExecuteTransactionBlockProps): Promise<SuiTransactionBlockResponse> => {
    if (!isConnected) {
      throw new Error("Wallet is not connected");
    }
    try {
      let digest = "";
      if (!isUsingEnoki || includesTransferTx) {
        // Sponsorship will happen in the back-end
        console.log("Sponsorship in the back-end...");
        const txBytes = await tx.build({
          client: suiClient,
          onlyTransactionKind: true,
        });
        console.log('address', address)
        const sponsorTxBody: SponsorTxRequestBody = {
          network,
          txBytes: toB64(txBytes),
          sender: address!,
          allowedAddresses,
        };
        console.log("Sponsoring transaction block...");
        const sponsorResponse: AxiosResponse<CreateSponsoredTransactionApiResponse> =
          await axios.post("/api/sponsor", sponsorTxBody);
        const { bytes, digest: sponsorDigest } = sponsorResponse.data;
        console.log("Signing transaction block...");
        const signature = await signTransaction(fromB64(bytes));
        console.log("Executing transaction block...");
        const executeSponsoredTxBody: ExecuteSponsoredTransactionApiInput = {
          signature,
          digest: sponsorDigest,
        };
        const executeResponse: AxiosResponse<{ digest: string }> =
          await axios.post("/api/execute", executeSponsoredTxBody);
        console.log("Executed response: ");
        digest = executeResponse.data.digest;
      } else {
        // Sponsorship can happen in the front-end
        console.log("Sponsorship in the front-end...");
        const response = await enokiFlow.sponsorAndExecuteTransaction({
          network: clientConfig.SUI_NETWORK_NAME,
          transaction: tx,
          client: suiClient,
        });
        digest = response.digest;
      }
      await suiClient.waitForTransaction({ digest, timeout: 5_000 });
      return suiClient.getTransactionBlock({
        digest,
        options,
      });
    } catch (err) {
      console.error(err);
      throw new Error("Failed to sponsor and execute transaction block");
    }
  };

  // some transactions cannot be sponsored by Enoki in its current state
  // for example when want to use the gas coin as an argument in a move call
  // so we provide an additional method to execute transactions without sponsorship
  const executeTransactionBlockWithoutSponsorship = async ({
    tx,
    options,
  }: ExecuteTransactionBlockWithoutSponsorshipProps): Promise<SuiTransactionBlockResponse | void> => {
    if (!isConnected) {
      return;
    }
    tx.setSender(address!);
    const txBytes = await tx.build({ client: suiClient });
    const signature = await signTransaction(txBytes);
    return suiClient.executeTransactionBlock({
      transactionBlock: txBytes,
      signature: signature!,
      requestType: "WaitForLocalExecution",
      options,
    });
  };
  
  
  return (
    <CustomWalletContext.Provider
      value={{
        isConnected,
        isUsingEnoki,
        address,
        jwt: zkLoginSession?.jwt,
        emailAddress,
        sponsorAndExecuteTransactionBlock,
        executeTransactionBlockWithoutSponsorship,
        logout,
        redirectToAuthUrl,
        getAddressSeed,
      }}
    >
      {children}
    </CustomWalletContext.Provider>
  );
}