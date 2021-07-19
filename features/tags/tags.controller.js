import { reply } from '../../helper.js';

export const mentionHandler = async action => {
  // handle mention of tags
  return reply(action, 'handle tags');
};
