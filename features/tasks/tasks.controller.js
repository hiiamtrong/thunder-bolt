import { reply } from '../../helper.js'

export const mentionHandler = async (action) => {
  // handle mention of task
  return reply(action, 'handle mention')
}
