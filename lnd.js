const {
    authenticatedLndGrpc
} = require('ln-service');

const fs = require('fs')
const config = require('./config')
const os = require('os')
const HOME_PATH = os.homedir()

const { lnd } = authenticatedLndGrpc({
    cert: fs.readFileSync(config.TLS_CERT_PATH || `${HOME_PATH}/.lnd/tls.cert`),
    macaroon: fs.readFileSync(config.MACAROON_PATH || `${HOME_PATH}/.lnd/data/chain/bitcoin/mainnet/admin.macaroon`),
    socket: config.SOCKET || `localhost:10009`,
});

module.exports = { lnd }