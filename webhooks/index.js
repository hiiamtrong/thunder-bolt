import bolt from '@slack/bolt'
import express from 'express'
import errorhandler from 'errorhandler'
import gitlab from './gitlab.webhook.js'
import logger from '../ulti/logger.js'

const receiver = new bolt.ExpressReceiver({
  signingSecret: process.env.SLACK_mSIGNING_SECRET,
})

receiver.router.use(express.json())
receiver.router.use(express.urlencoded({ extended: true }))
receiver.router.use(gitlab)
receiver.router.use(errorhandler({ log: errorNotification }))

function errorNotification(err, str, req) {
  return logger.error(err.message || JSON.stringify(err))
}

export default receiver
