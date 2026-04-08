import { config } from '../config/index.js';

interface MpesaAuthTokenResponse {
  access_token: string;
  expires_in: string;
}

export interface StkPushRequestPayload {
  amount: number;
  phoneNumber: string;
  accountReference?: string;
  transactionDesc: string;
}

export interface StkPushResponsePayload {
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  ResponseCode?: string;
  ResponseDescription?: string;
  CustomerMessage?: string;
  errorCode?: string;
  errorMessage?: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

const getMpesaBaseUrl = () =>
  config.mpesa.environment === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

const createTimestamp = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}${hh}${min}${ss}`;
};

export const normalizeKenyanPhone = (phone: string): string | null => {
  const digits = phone.replace(/[^\d+]/g, '').replace(/^\+/, '');

  if (/^254\d{9}$/.test(digits)) {
    return digits;
  }
  if (/^0\d{9}$/.test(digits)) {
    return `254${digits.slice(1)}`;
  }
  if (/^7\d{8}$/.test(digits)) {
    return `254${digits}`;
  }

  return null;
};

const getAccessToken = async (): Promise<string> => {
  if (!config.mpesa.consumerKey || !config.mpesa.consumerSecret) {
    throw new Error('M-Pesa credentials are not configured');
  }

  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const credentials = Buffer.from(
    `${config.mpesa.consumerKey}:${config.mpesa.consumerSecret}`
  ).toString('base64');

  const response = await fetch(`${getMpesaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to fetch M-Pesa token: ${response.status} ${body}`);
  }

  const data = (await response.json()) as MpesaAuthTokenResponse;
  const expiresInSeconds = parseInt(data.expires_in || '3599', 10);
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(expiresInSeconds - 60, 60) * 1000,
  };
  return data.access_token;
};

export const initiateStkPush = async (
  payload: StkPushRequestPayload
): Promise<StkPushResponsePayload> => {
  if (!config.mpesa.enabled) {
    throw new Error('M-Pesa integration is disabled');
  }
  if (!config.mpesa.shortCode || !config.mpesa.passkey || !config.mpesa.callbackUrl) {
    throw new Error('M-Pesa shortcode/passkey/callback URL are not fully configured');
  }

  const token = await getAccessToken();
  const timestamp = createTimestamp();
  const password = Buffer.from(
    `${config.mpesa.shortCode}${config.mpesa.passkey}${timestamp}`
  ).toString('base64');

  const requestPayload = {
    BusinessShortCode: config.mpesa.shortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: config.mpesa.transactionType,
    Amount: Math.round(payload.amount),
    PartyA: payload.phoneNumber,
    PartyB: config.mpesa.shortCode,
    PhoneNumber: payload.phoneNumber,
    CallBackURL: config.mpesa.callbackUrl,
    AccountReference: payload.accountReference || config.mpesa.accountReference,
    TransactionDesc: payload.transactionDesc,
  };

  const response = await fetch(`${getMpesaBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestPayload),
  });

  const rawBody = await response.text();
  let parsed: StkPushResponsePayload = {};
  try {
    parsed = JSON.parse(rawBody) as StkPushResponsePayload;
  } catch {
    parsed = { errorMessage: rawBody };
  }

  if (!response.ok) {
    return {
      ...parsed,
      errorCode: parsed.errorCode || String(response.status),
      errorMessage: parsed.errorMessage || parsed.ResponseDescription || 'Failed to initiate M-Pesa STK push',
    };
  }

  return parsed;
};
