const { getChannels, pay } = require('ln-service')
const { requestInvoice } = require('lnurl-pay')
const config = require('./config.json')
const { lnd } = require('./lnd')
const PATHFINDING_TIMEOUT_MS = config.PATHFINDING_TIMEOUT_MS || 60 * 1000 // 1 minute
const DEEZY_PUBKEY = '024bfaf0cabe7f874fd33ebf7c6f4e5385971fc504ef3f492432e9e3ec77e1b5cf'

async function fetchLnurlInvoice({ lnUrlOrAddress, paymentAmountSats }) {
    console.log(`Fetching invoice from ${lnUrlOrAddress} for ${paymentAmountSats} sats`)
    const { invoice } =
        await requestInvoice({
            lnUrlOrAddress,
            tokens: paymentAmountSats // satoshis
        }).catch(err => {
            console.error(err)
            return { invoice: null }
        })
    return invoice
}

async function fetchBfxInvoice() {
    console.error('BFX not implemented yet')
    return null
}

async function tryPayInvoice({ invoice, paymentAmountSats, maxRouteFeePpm, outChannelIds }) {
    const maxRouteFeeSats = Math.floor(maxRouteFeePpm * paymentAmountSats / 1000000)
    console.log(`Using max route fee sats ${maxRouteFeeSats}`)

    // Sometimes LND hangs too long when trying to pay, and we need to kill the process.
    function abortMission() {
        console.error("Payment timeout exceeded without terminating. Exiting!")
        process.exit(1)
    }

    const paymentTimeout = setTimeout(abortMission, PATHFINDING_TIMEOUT_MS * 2)
    const paymentResult = await pay(
        {
            lnd,
            request: invoice,
            outgoing_channels: outChannelIds,
            max_fee: maxRouteFeeSats,
            pathfinding_timeout: PATHFINDING_TIMEOUT_MS,
        }
    ).catch(err => {
        console.error(err)
        console.log(`Failed to pay invoice ${invoice}`)
        return null
    })
    clearTimeout(paymentTimeout)

    if (!paymentResult || !paymentResult.confirmed_at) return

    const feePpm = Math.round(paymentResult.safe_fee * 1000000 / paymentAmountSats)
    console.log(`Payment confirmed, with fee ${paymentResult.safe_fee} satoshis, and ppm ${feePpm}`)
}

async function run({ destination, outChannelIds }) {
    let invoice
    switch (destination.type) {
        case 'LNURL':
            invoice = await fetchLnurlInvoice({
                lnUrlOrAddress: destination.LNURL_OR_ADDRESS,
                paymentAmountSats: destination.PAYMENT_AMOUNT_SATS
            })
            break;
        case 'BITFINEX':
            invoice = await fetchBfxInvoice({ destination })
            break;
        default:
            console.error(`Unknown type ${destination.type}`)
            return
    }
    if (!invoice) {
        console.log('no invoice returned')
        return
    }

    await tryPayInvoice({
        invoice,
        paymentAmountSats,
        maxRouteFeePpm: destination.MAX_ROUTE_FEE_PPM,
        outChannelIds
    }).catch(err => {
        console.error(err)
    })
}

async function run() {
    const { channels } = await getChannels({ 
        lnd,
        partner_public_key: DEEZY_PUBKEY
    })
    const outChannelIds = channels.filter(it => !it.is_partner_initiated).map(it => it.id)
    for (const destination of config.DESTINATIONS) {
        await run({ destination, outChannelIds }).catch(err => {
            console.error(err)
        })
    }
}

run()