
const { requestInvoice } = require('lnurl-pay')

async function fetchInvoice({ lnUrlOrAddress, paymentAmountSats }) {
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

module.exports = { fetchInvoice }