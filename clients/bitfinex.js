const axios = require('axios');
const crypto = require('crypto');

async function fetchInvoice ({ paymentAmountSats, apiSecret, apiKey }) {
  const { invoice } = await createBfxInvoice({ amountMsat: paymentAmountSats * 1000, apiKey, apiSecret });
  return invoice;
}

async function maybeAutoWithdraw ({ apiKey, apiSecret, minWithdrawalSats, address }) {
  const { lnxBalance, lnxAvailableBalance, btcBalance, btcAvailableBalance } = await getBitcoinWalletBalance({
    apiKey,
    apiSecret,
  });
  console.log(`Bitfinex BTC balance ${btcBalance} and available balance ${btcAvailableBalance}`);
  console.log(`Bitfinex LNX balance ${lnxBalance} and available balance ${lnxAvailableBalance}`);
  if (btcAvailableBalance + lnxAvailableBalance > minWithdrawalSats) {
    console.log('Bitfinex account has enough BTC to withdraw');
    if (lnxAvailableBalance > 0) {
      await transferLnxToBtc({ lnxAvailableBalance, apiKey, apiSecret });
      const sleepSecs = 30;
      console.log(`sleeping for ${sleepSecs} seconds while LNX is being converted to BTC`);
      await sleep(sleepSecs * 1000);
    }
    await withdrawFunds({
      amountBtc: btcAvailableBalance + lnxAvailableBalance,
      toAddress: address,
      apiKey,
      apiSecret,
    });
  } else {
    console.log('Bitfinex account does not have enough BTC to withdraw');
  }
}

function generateHeaders ({ path, body, apiKey, apiSecret }) {
  const nonce = (Date.now() * 1000).toString();
  const payload = `/api/${path}${nonce}${JSON.stringify(body)}`;
  const signature = crypto.createHmac('sha384', apiSecret).update(payload).digest('hex');
  return {
    'bfx-nonce': nonce,
    'bfx-signature': signature,
    'bfx-apikey': apiKey,
    'content-type': 'application/json',
  };
}

async function createBfxInvoice ({ amountMsat, apiKey, apiSecret }) {
  const path = 'v2/auth/w/deposit/invoice';
  const postData = {
    wallet: 'exchange',
    currency: 'LNX',
    amount: ((amountMsat * 1.0) / 100000000000).toFixed(8), // Convert msats to BTC.
  };
  const headers = generateHeaders({ path, body: postData, apiKey, apiSecret });
  const result = await axios.post(`https://api.bitfinex.com/${path}`, postData, { headers });
  console.log(result.data);
  const [, invoice] = result.data;
  return { invoice };
}

async function getBitcoinWalletBalance ({ apiKey, apiSecret }) {
  const path = 'v2/auth/r/wallets';
  const postData = {};
  const headers = generateHeaders({ path, body: postData, apiKey, apiSecret });
  const result = await axios.post(`https://api.bitfinex.com/${path}`, postData, { headers });
  console.log(result.data);
  const lnxWalletBalances = result.data.find((it) => it[0] === 'exchange' && it[1] === 'LNX');
  const btcWalletBalances = result.data.find((it) => it[0] === 'exchange' && it[1] === 'BTC');
  return {
    lnxBalance: (lnxWalletBalances && lnxWalletBalances[2]) || 0,
    lnxAvailableBalance: (lnxWalletBalances && lnxWalletBalances[4]) || 0,
    btcBalance: (btcWalletBalances && btcWalletBalances[2]) || 0,
    btcAvailableBalance: (btcWalletBalances && btcWalletBalances[4]) || 0,
  };
}

async function transferLnxToBtc ({ lnxAvailableBalance, apiKey, apiSecret }) {
  console.log(`Transferring ${lnxAvailableBalance} LNX to BTC`);
  const path = 'v2/auth/w/transfer';
  const postData = {
    from: 'exchange',
    to: 'exchange',
    currency: 'LNX',
    currency_to: 'BTC',
    amount: `${lnxAvailableBalance}`,
  };
  const headers = generateHeaders({ path, body: postData, apiKey, apiSecret });
  const result = await axios.post(`https://api.bitfinex.com/${path}`, postData, { headers });
  console.log(result.data);
}

async function withdrawFunds ({ amountBtc, toAddress, apiKey, apiSecret }) {
  console.log(`Withdrawing ${amountBtc} BTC to ${toAddress}`);
  const path = 'v2/auth/w/withdraw';
  const postData = {
    wallet: 'exchange',
    method: 'bitcoin',
    amount: `${amountBtc}`,
    address: toAddress,
    fee_deduct: 1,
  };
  const headers = generateHeaders({ path, body: postData, apiKey, apiSecret });
  const result = await axios.post(`https://api.bitfinex.com/${path}`, postData, { headers });
  console.log(result.data);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = { fetchInvoice, maybeAutoWithdraw };
