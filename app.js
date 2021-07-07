import config from './configs/config.js'
import { mentionHandler } from './features/tasks/tasks.controller.js'
import app from './libs/slack.js'
import logger from './ultis/logger.js'
import('./configs/database.js')

// listen message
// app.message(async (action) => {
//   await reply(action, 'hello world')
// })

// listen event

app.error((error) => {
  return logger.error(error.stack || error.message || JSON.stringify(error))
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
