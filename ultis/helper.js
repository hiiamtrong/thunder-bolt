import _ from 'lodash'

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
