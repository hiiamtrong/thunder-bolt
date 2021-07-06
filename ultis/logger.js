import path from 'path'
import winston from 'winston'
import config from '../configs/config.js'

const __dirname = path.resolve(path.dirname(''))

const logger = winston.createLogger({
  format: winston.format.combine(
    config.app.environment === 'dev'
      ? winston.format.colorize()
      : winston.format.uncolorize(),
    winston.format.splat(),
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm',
    }),
    winston.format.printf((log) => {
      return `[${log.timestamp}] [${log.level}] ${
        log.stack ? log.stack : log.message
      }`
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      level: 'error',
      filename: path.join(__dirname, 'errors.log'),
    }),
    new winston.transports.File({
      filename: path.join(__dirname, 'all.log'),
    }),
  ],
})

export default logger
