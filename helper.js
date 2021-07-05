import _ from 'lodash'

export const reply = async (action, text) => {
  const { client } = action
  const { event } = action.body
  let threadTs = _.get(event, 'thread_ts', event.ts)

  await client.chat.postMessage({
    channel: event.channel,
    text: text,
    thread_ts: threadTs,
  })
}
