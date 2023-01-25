const {
    authenticatedLndGrpc
} = require('ln-service');
const { logger } = require('../utils/logger');
const fs = require('fs')
const config = require('./config')
const os = require('os');
const HOME_PATH = os.homedir()

const certPath = config.OMIT_TLS_CERT || `${HOME_PATH}/.lnd/tls.cert`;
const macaroonPath = config.MACAROON_PATH || `${HOME_PATH}/.lnd/data/chain/bitcoin/mainnet/admin.macaroon`;
const socket = config.SOCKET || 'localhost:10009';
logger.debug('Lnd configuration', { data: { certPath, macaroonPath, socket } });

const { lnd } = authenticatedLndGrpc({
    cert: fs.readFileSync(certPath, { encoding: 'base64' }),
    macaroon: fs.readFileSync(macaroonPath, { encoding: 'base64' }),
    socket
});

module.exports = { lnd }