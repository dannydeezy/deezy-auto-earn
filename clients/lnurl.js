
const { requestInvoice, utils } = require('lnurl-pay')
const { isOnionUrl, decodeUrlOrAddress } = utils
const { logger } = require('../utils/logger');
const tor_axios = require('tor-axios');
const config = require('../config.json')

const torSetup = {
    ip: config.TOR_HOST,
    port: config.TOR_PORT || 9050,
}

logger.debug('Tor configuration', { data: torSetup });

const tor = tor_axios.torSetup(torSetup)

async function torGet({ url, params }) {
    logger.debug('Tor get', { data: { url, params } });
    const resp = await tor.get(url, { params })
    return resp.data
}

async function fetchInvoice({ lnUrlOrAddress, paymentAmountSats }) {
    const url = decodeUrlOrAddress(lnUrlOrAddress)
    logger.debug('Decoded UrlOrAddress', { data: url} )

    const isOnion = isOnionUrl(url)
    logger.info(`Fetching invoice from ${lnUrlOrAddress} for ${paymentAmountSats} sats`)

    const { invoice } =
        await requestInvoice({
            lnUrlOrAddress,
            tokens: paymentAmountSats, // satoshis
            onionAllowed: isOnion,
            fetchGet: isOnion ? torGet : undefined
        }).catch(err => {
            logger.error('Failed to fetch invoice', { data: err })
            return { invoice: null }
        })
    return invoice
}

module.exports = { fetchInvoice }