import _ from 'lodash'
import {getUserInfo} from '../libs/slack.js'
export const reply = async (action, text) => {
  const { client } = action
  const { event } = action.body
  let threadTs = getThreadTS(action)

  await client.chat.postMessage({
    channel: event.channel,
    text: text,
    thread_ts: threadTs,
  })
}
export const replaceIdSlack = (text) => {
  const allIdSlack = text.match(/<@(.*?)>/gi).join('').replace(/[<@>]/g,' ').split(' ')
  Promise.each(allIdSlack, async (idSlack) => {
    const userInfo = await getUserInfo({user: idSlack})
    text.replace(new RegExp(`${idSlack}`), userInfo.real_name)
  })
  return text
}
export const getThreadTS = (action) => {
  const { event } = action.body
  return _.get(event, 'thread_ts', event.ts)
}

export const getMentionUser = ({ payload }) => {
  return payload.user
}

export const replaceAll = (string, matchPattern, replacement) => {
  return string.split(matchPattern).join(replacement)
}
