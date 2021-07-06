import bolt from '@slack/bolt'
import dotenv from 'dotenv'
dotenv.config()

import { mentionHandler } from './features/tasks/tasks.controller.js'

const { App, LogLevel } = bolt

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: false,
  // developerMode: process.env.NODE_ENV === 'dev' ? true : false,
  // LogLevel: LogLevel.DEBUG,
  // appToken: process.env.APP_TOKEN,
})

// listen message
// app.message(async (action) => {
//   await reply(action, 'hello world')
// })

// listen event

app.error((error) => {
  console.error(error)
})

app.event('app_mention', async (action) => {
  await mentionHandler(action)
})

// Start the app
;(async () => {
  const PORT = process.env.PORT || 3000
  await app.start(PORT)

  console.log(`⚡️ Bolt app is running at port ${PORT}!`)
})()
