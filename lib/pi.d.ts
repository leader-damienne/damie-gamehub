export {};

declare global {
  type PiScope = "username" | "payments" | "wallet_address";

  type PiUser = {
    uid: string;
    username?: string;
    wallet_address?: string;
  };

  type PiAuthResult = {
    accessToken: string;
    user: PiUser;
  };

  type PiPaymentDTO = {
    identifier: string;
    user_uid: string;
    amount: number;
    memo: string;
    metadata: Record<string, unknown>;
    from_address: string;
    to_address: string;
    created_at: string;
    network: string;
    status: {
      developer_approved: boolean;
      transaction_verified: boolean;
      developer_completed: boolean;
      cancelled: boolean;
      user_cancelled: boolean;
    };
    transaction: null | { txid: string; verified: boolean; _link: string };
  };

  type PiShowAdResponse =
    | {
        type: "interstitial";
        result: "AD_CLOSED" | "AD_DISPLAY_ERROR" | "AD_NETWORK_ERROR" | "AD_NOT_AVAILABLE";
      }
    | {
        type: "rewarded";
        result:
          | "AD_REWARDED"
          | "AD_CLOSED"
          | "AD_DISPLAY_ERROR"
          | "AD_NETWORK_ERROR"
          | "AD_NOT_AVAILABLE"
          | "ADS_NOT_SUPPORTED"
          | "USER_UNAUTHENTICATED";
        adId?: string;
      };

  interface Window {
    Pi?: {
      init: (options: { version: string; sandbox?: boolean }) => Promise<void>;
      authenticate: (
        scopes: PiScope[],
        onIncompletePaymentFound: (payment: PiPaymentDTO) => void,
      ) => Promise<PiAuthResult>;
      createPayment: (
        paymentData: { amount: number; memo: string; metadata: Record<string, unknown> },
        callbacks: {
          onReadyForServerApproval: (paymentId: string) => void;
          onReadyForServerCompletion: (paymentId: string, txid: string) => void;
          onCancel: (paymentId: string) => void;
          onError: (error: Error, payment?: PiPaymentDTO) => void;
        },
      ) => void;
      Ads?: {
        showAd: (adType: "interstitial" | "rewarded") => Promise<PiShowAdResponse>;
        isAdReady: (adType: "interstitial" | "rewarded") => Promise<{ type: string; ready: boolean }>;
        requestAd: (adType: "interstitial" | "rewarded") => Promise<{ type: string; result: string }>;
      };
      openShareDialog?: (title: string, message: string) => void;
      nativeFeaturesList?: () => Promise<string[]>;
    };
  }
}
