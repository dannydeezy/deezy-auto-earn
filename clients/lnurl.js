const { requestInvoice, utils } = require('lnurl-pay');
const { isOnionUrl, decodeUrlOrAddress } = utils;
const torAxios = require('tor-axios');
const config = require('../config.json');

const tor = torAxios.torSetup({
  ip: config.TOR_HOST,
  port: config.TOR_PORT || 9050,
});

async function torGet ({ url, params }) {
  console.log({ url, params });
  const resp = await tor.get(url, { params });
  return resp.data;
}

async function fetchInvoice ({ lnUrlOrAddress, paymentAmountSats }) {
  const url = decodeUrlOrAddress(lnUrlOrAddress);
  console.log(url);
  const isOnion = isOnionUrl(url);
  console.log(`Fetching invoice from ${lnUrlOrAddress} for ${paymentAmountSats} sats`);
  const { invoice } = await requestInvoice({
    lnUrlOrAddress,
    tokens: paymentAmountSats, // satoshis
    onionAllowed: isOnion,
    fetchGet: isOnion ? torGet : undefined,
  }).catch((err) => {
    console.error(err);
    return { invoice: null };
  });
  return invoice;
}

module.exports = { fetchInvoice };
