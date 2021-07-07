import bolt from '@slack/bolt'
import config from '../configs/config.js'
import receiver from '../webhooks/index.js'
const { App, LogLevel } = bolt
import _ from 'lodash'

export const app = new App({
  token: config.slack.token,
  socketMode: false,
  receiver,
  // developerMode: config.app.environment === 'dev' ? true : false,
  // LogLevel: LogLevel.DEBUG,
  // appToken: config.slack.appToken,
})
export const getConversation = async ({ channel, ts }) => {
  try {
    const thread = await app.client.conversations.replies({
      channel,
      ts,
    })
    return thread.messages
  } catch (err) {
    throw err
  }
}
export const getUserInfo = async (user) => {
  try {
    const res = await app.client.users.info({
      user,
    })
    if (!res.ok) {
      throw new Error(res.error)
    }
    return res.user
  } catch (err) {
    throw err
  }
}

export const react = async ({ channel, ts, reacts }) => {
  return Promise.all(
    _.map(reacts, (react) => {
      return app.client.reactions.add({ channel, timestamp: ts, name: react })
    })
  )
}
export const getBotInfo = async (botId) => {
  return app.client.bots.info({ bot: botId })
}

export default app
