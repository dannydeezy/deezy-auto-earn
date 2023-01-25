const { createLogger, format, transports } = require("winston");
const path = require('path');
const isRunningOnDocker = require("./isRunningOnDocker");

const basePath = path.join(__dirname, '../');

const _LOGS_PATH = path.join(basePath, "exceptions.log");
const _EXCEPTIONS_PATH = path.join(basePath, "exceptions.log");
const _REJECTIONS_PATH = path.join(basePath,"rejections.log");

const isDocker = isRunningOnDocker();

const transporters = [new transports.Console({level: isDocker ? 'info' : 'debug'})]

if (isDocker) {
    transporters.push(new transports.File({ filename: _LOGS_PATH, level: 'debug' }))
}

const logger = createLogger({
  format: format.combine(format.timestamp(), format.json()),
  transports: transporters,
  exceptionHandlers: [new transports.File({ filename: _EXCEPTIONS_PATH })],
  rejectionHandlers: [new transports.File({ filename: _REJECTIONS_PATH })],
});

module.exports = { logger };