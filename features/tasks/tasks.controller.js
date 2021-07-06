import { createCard, moveCard } from '../../app/trello.js'
import { reply } from '../../helper.js'

export const mentionHandler = async (action) => {
  // handle mention of task

  const { text } = action.payload
  const match = text.match(/(name) ("\w.*") assign ("\w.*")/gi)
  if (match) {
    console.log({ match })
    return reply(action, JSON.stringify(match))
  }
  return reply(action, 'handle mention')
}
