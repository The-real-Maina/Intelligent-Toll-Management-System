const axios = require('axios');

const BASE_URL = process.env.MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

// Get OAuth access token
async function getAccessToken() {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  try {
    const response = await axios.get(
      `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: { Authorization: `Basic ${auth}` },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting M-Pesa access token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with M-Pesa');
  }
}

// Generate the timestamp Daraja expects (YYYYMMDDHHmmss)
function getTimestamp() {
  const date = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

// Generate the base64 password required by STK Push
function getPassword(timestamp) {
  const str = `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`;
  return Buffer.from(str).toString('base64');
}

// Trigger STK Push (the prompt on the driver's phone)
async function initiateSTKPush({ phoneNumber, amount, accountReference, transactionDesc }) {
  const accessToken = await getAccessToken();
  const timestamp = getTimestamp();
  const password = getPassword(timestamp);

  // Daraja expects phone in format 2547XXXXXXXX (no +, no leading 0)
  const formattedPhone = formatPhoneNumber(phoneNumber);

  const payload = {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(amount), // M-Pesa sandbox rejects decimals
    PartyA: formattedPhone,
    PartyB: process.env.MPESA_SHORTCODE,
    PhoneNumber: formattedPhone,
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: accountReference, // e.g. toll transaction ID
    TransactionDesc: transactionDesc || 'Toll Payment',
  };

  try {
    const response = await axios.post(
      `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data; // contains CheckoutRequestID, MerchantRequestID
  } catch (error) {
    console.error('STK Push error:', error.response?.data || error.message);
    throw new Error('Failed to initiate M-Pesa payment');
  }
}

function formatPhoneNumber(phone) {
  let formatted = phone.replace(/\s+/g, '').replace(/^\+/, '');
  if (formatted.startsWith('0')) {
    formatted = '254' + formatted.slice(1);
  }
  if (!formatted.startsWith('254')) {
    formatted = '254' + formatted;
  }
  return formatted;
}

module.exports = {
  getAccessToken,
  initiateSTKPush,
  formatPhoneNumber,
};