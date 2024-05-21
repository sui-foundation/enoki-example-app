'use client';

import { useEnokiFlow } from "@mysten/enoki/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { jwtDecode } from 'jwt-decode';

export default function Home() {

  const enokiFlow = useEnokiFlow();
  const [session, setSession] = useState<any | null>(null);
  const [keypair, setKeypair] = useState<any | null>(null);
 
  
  useEffect(() => {
    completeLogin();
  }, []);

  const completeLogin = async () => {
    // const hash = window.location.hash.slice(1).trim()
    // console.log('hash', hash)

    // // remove the URL fragment
    // window.history.replaceState(null, '', window.location.pathname);

    // if (!hash) {
    //   return;
    // }

    try {
      const res = await enokiFlow.handleAuthCallback();
      console.log('res', res);
    } catch (error) {
      console.error('error', error);
    } finally {
      
      try {
        const session = await enokiFlow.getSession();
        console.log('session', session);
        setSession(session);

        const keypair = await enokiFlow.getKeypair({network: 'testnet'});
        console.log('keypair', keypair);
        setKeypair(keypair);
      } catch (error) {
        console.error('error', error);
      }

      // remove the URL fragment
      window.history.replaceState(null, '', window.location.pathname);
    }

    
  }

  if (session) {
    return (
      <div className="flex flex-col items-center justify-start">
        <h1>Welcome!</h1>
        <p className="max-w-md">Session: {JSON.stringify(session, null, 4)}</p>
        <p>Keypair: {JSON.stringify(keypair, null, 4)}</p>
        <button onClick={async () => {
          await enokiFlow.logout();
          window.location.reload();
        }}>
          Logout
        </button>
      </div>
    );
  }
  
  return (
   <div className="flex flex-col items-center justify-start">
      <button onClick={async () => {
        window.location.href = await enokiFlow.createAuthorizationURL({
          provider: 'google',
          clientId: '277348171272-t8cbpuva58cgv18p581k8hrepponv8p3.apps.googleusercontent.com',
          redirectUrl: window.location.href.split('#')[0],
          network: 'testnet'
        });
      }}>
        Sign in with Google
      </button>
   </div>
  );
}
