
const { logger } = require('../utils/logger');
const axios = require('axios')
const crypto = require('crypto')

async function fetchInvoice({ paymentAmountSats, apiSecret, apiKey }) {
    const { invoice } = await createBfxInvoice({ amountMsat: paymentAmountSats * 1000, apiKey, apiSecret })
    return invoice
}

async function maybeAutoWithdraw({ apiKey, apiSecret, minWithdrawalSats, address }) {
    const {
        lnxBalance,
        lnxAvailableBalance,
        btcBalance,
        btcAvailableBalance
    } = await getBitcoinWalletBalance({ apiKey, apiSecret })
    logger.info(`Bitfinex BTC balance ${btcBalance} and available balance ${btcAvailableBalance}`)
    logger.info(`Bitfinex LNX balance ${lnxBalance} and available balance ${lnxAvailableBalance}`)
    if (btcAvailableBalance + lnxAvailableBalance > minWithdrawalSats) {
        logger.info(`Bitfinex account has enough BTC to withdraw`)
        if (lnxAvailableBalance > 0) {
            await transferLnxToBtc({ lnxAvailableBalance, apiKey, apiSecret })
            const sleepSecs = 30
            logger.info(`sleeping for ${sleepSecs} seconds while LNX is being converted to BTC`)
            await sleep(sleepSecs * 1000)
        }
        await withdrawFunds({ amountBtc: btcAvailableBalance + lnxAvailableBalance, toAddress: address, apiKey, apiSecret })
    } else {
        logger.info(`Bitfinex account does not have enough BTC to withdraw`)
    }
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

    const [, invoice] = result.data;
    return { invoice };
}


async function getBitcoinWalletBalance({ apiKey, apiSecret }) {
    const path = 'v2/auth/r/wallets';
    let postData = {};
    const headers = generateHeaders({ path, body: postData, apiKey, apiSecret })
    const result = await axios.post(`https://api.bitfinex.com/${path}`, postData, { headers })

    const lnxWalletBalances = result.data.find(it => it[0] === 'exchange' && it[1] === 'LNX')
    const btcWalletBalances = result.data.find(it => it[0] === 'exchange' && it[1] === 'BTC')
    return {
        lnxBalance: (lnxWalletBalances && lnxWalletBalances[2]) || 0,
        lnxAvailableBalance: (lnxWalletBalances && lnxWalletBalances[4]) || 0,
        btcBalance: (btcWalletBalances && btcWalletBalances[2]) || 0,
        btcAvailableBalance: (btcWalletBalances && btcWalletBalances[4]) || 0,
    }
}

async function transferLnxToBtc({ lnxAvailableBalance, apiKey, apiSecret }) {
    logger.info(`Transferring ${lnxAvailableBalance} LNX to BTC`)
    const path = 'v2/auth/w/transfer';
    let postData = {
        from: 'exchange',
        to: 'exchange',
        currency: 'LNX',
        currency_to: 'BTC',
        amount: `${lnxAvailableBalance}`,
    };
    const headers = generateHeaders({ path, body: postData, apiKey, apiSecret })
    await axios.post(`https://api.bitfinex.com/${path}`, postData, { headers })
}

async function withdrawFunds({ amountBtc, toAddress, apiKey, apiSecret }) {
    logger.info(`Withdrawing ${amountBtc} BTC to ${toAddress}`)
    const path = 'v2/auth/w/withdraw';
    let postData = {
        wallet: 'exchange',
        method: 'bitcoin',
        amount: `${amountBtc}`,
        address: toAddress,
        fee_deduct: 1
    };
    const headers = generateHeaders({ path, body: postData, apiKey, apiSecret })
    await axios.post(`https://api.bitfinex.com/${path}`, postData, { headers })
}

const sleep = ms => new Promise(res => setTimeout(res, ms));

module.exports = { fetchInvoice, maybeAutoWithdraw }