
const axios = require('axios')
const crypto = require('crypto')

async function fetchInvoice({ paymentAmountSats, apiSecret, apiKey, orgId }) {
    const { invoice } = await createNicehashInvoice({ amountMsat: paymentAmountSats * 1000, apiKey, apiSecret, orgId })
    return invoice
}

async function maybeAutoWithdraw({ apiKey, apiSecret, minWithdrawalSats, address, orgId }) {
    const {
        btcTotalBalance,
        btcAvailableBalance
    } = await getBitcoinWalletBalance({ apiKey, apiSecret, orgId })
    console.log(`Nicehash BTC total balance ${btcTotalBalance} and available balance ${btcAvailableBalance}`)
    if (btcAvailableBalance > minWithdrawalSats) {
        console.log(`Nicehash account has enough BTC to withdraw`)
        await withdrawFunds({ amountBtc: btcAvailableBalance, toAddress: address, apiKey, apiSecret, orgId })
    } else {
        console.log(`Nicehash account does not have enough BTC to withdraw`)
    }
}

//completed header
function generateHeaders({ path, body, apiKey, apiSecret, orgId }) {
    const nonce = (Date.now() * 1000).toString();
    // const currentTime = Date.now().toString();
    let payload = `/${path}${nonce}${JSON.stringify(body)}`;
    // let payload = `/api/${path}${nonce}${JSON.stringify(body)}`;
    const signature = crypto.createHmac('sha256', apiSecret).update(payload).digest('hex');

    console.log("orgId:", orgId);

    return {
        'X-nonce': nonce,
        'X-Auth': signature,
        'X-Api-Key': apiKey,
        'X-Organization-Id': orgId,
        // 'X-Time': currentTime,
        'content-type': 'application/json'
    };
}

//completed invoice and checked it online
async function createNicehashInvoice({ amountMsat, apiKey, apiSecret, orgId }) {
    const path = 'main/api/v2/accounting/depositAddresses';
    let postData = {
        walletType: 'LIGHTNING',
        currency: 'BTC',
        amount: (amountMsat * 1.0 / 100000000000).toFixed(8) // Convert msats to BTC.
    };
    const headers = generateHeaders({ path, body: postData, apiKey, apiSecret, orgId })
    const result = await axios.post(`https://api2.nicehash.com/${path}`, postData, { headers });
    console.log(result.data)
    const [invoiceHash, invoice, placeholder1, placeholder2, amount] = result.data;
    return { invoice };
}

//completed getBitcoinWalletBalance
async function getBitcoinWalletBalance({ apiKey, apiSecret, orgId }) {
    const path = 'main/api/v2/accounting/account2/BTC';
    let postData = {};
    const headers = generateHeaders({ path, body: postData, apiKey, apiSecret, orgId })
    const result = await axios.get(`https://api2.nicehash.com/${path}`, { headers });
    // const result = await axios.post(`https://api2.nicehash.com/${path}`, postData, { headers })

    console.log(result.data)
    const btcTotalBalance = result.data.total.value;
    const btcAvailableBalance = result.data.available.value;
    return {
        btcTotalBalance,
        btcAvailableBalance,
    }
}

async function withdrawFunds({ amountBtc, toAddress, apiKey, apiSecret, orgId }) {
    console.log(`Withdrawing ${amountBtc} BTC to ${toAddress}`)
    const path = 'main/api/v2/accounting/withdrawal';
    let postData = {
        currency: 'BTC',
        amount: `${amountBtc}`,
        autoConfirm: true,
        address: toAddress,
    };
    const headers = generateHeaders({ path, body: postData, apiKey, apiSecret, orgId })
    const result = await axios.post(`https://api2.nicehash.com/${path}`, postData, { headers })
    console.log(result.data)
}

const sleep = ms => new Promise(res => setTimeout(res, ms));

module.exports = { fetchInvoice, maybeAutoWithdraw }
