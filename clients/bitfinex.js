
const axios = require('axios')
const crypto = require('crypto')

async function fetchInvoice({ paymentAmountSats, apiSecret, apiKey }) {
    const { invoice } = await createBfxInvoice({ amountMsat: paymentAmountSats * 1000, apiKey, apiSecret })
    return invoice
}

function generateHeaders({ path, body, apiKey, apiSecret }) {
    const nonce = (Date.now() * 1000).toString();
    let payload = `/api/${path}${nonce}${JSON.stringify(body)}`;
    const signature = crypto.createHmac('sha384', apiSecret).update(payload).digest('hex');
    return {
        'bfx-nonce': nonce,
        'bfx-signature': signature,
        'bfx-apikey': apiKey,
        'content-type': 'application/json'
    };
}

async function createBfxInvoice({ amountMsat, apiKey, apiSecret }) {
    const path = 'v2/auth/w/deposit/invoice';
    let postData = {
        wallet: 'exchange',
        currency: 'LNX',
        amount: (amountMsat * 1.0 / 100000000000).toFixed(8) // Convert msats to BTC.
    };
    const headers = generateHeaders({ path, body: postData, apiKey, apiSecret })
    const result = await axios.post(`https://api.bitfinex.com/${path}`, postData, { headers });
    console.log(result.data)
    const [invoiceHash, invoice, placeholder1, placeholder2, amount] = result.data;
    return { invoice };
}

module.exports = { fetchInvoice }