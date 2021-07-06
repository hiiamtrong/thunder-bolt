import bolt from '@slack/bolt'
import config from './configs/config.js'
import { mentionHandler } from './features/tasks/tasks.controller.js'
import logger from './ultis/logger.js'
import receiver from './webhooks/index.js'
import('./configs/database.js')
const { App, LogLevel } = bolt

const app = new App({
  token: config.slack.token,
  socketMode: false,
  receiver,
  // developerMode: config.app.environment === 'dev' ? true : false,
  // LogLevel: LogLevel.DEBUG,
  // appToken: config.slack.appToken,
})

// listen message
// app.message(async (action) => {
//   await reply(action, 'hello world')
// })

// listen event

app.error((error) => {
  return logger.error(error.message || JSON.stringify(error))
})

app.event('app_mention', async (action) => {
  await mentionHandler(action)
})

// Start the app
;(async () => {
  const PORT = config.app.port || 3000
  await app.start(PORT)

  console.log(`⚡️ Bolt app is running at port ${PORT}!`)
})()
