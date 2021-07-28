import _ from 'lodash';
import { getUserInfo } from '../libs/slack.js';
export const reply = async ({ action, text, blocks }) => {
  const { client } = action;
  const { event } = action.body;
  let threadTs = getThreadTS(action);

  await client.chat.postMessage({
    channel: event.channel,
    text: text,
    thread_ts: threadTs,
    blocks,
  });
};
export const getSlackIdsFromMessage = text => {
  return replaceAll(getTaggedUsers(text).join(' '), /[<@>]/, '').split(/\s+/);
};
export function makeMap(collections, keyPath, value) {
  if (!keyPath) throw new Error('`keyPath` for `makeMap` was not provided!');
  return _.reduce(
    collections,
    (result, item) => {
      const attr = _.get(item, keyPath);
      let key = attr;
      if (_.isFunction(attr)) {
        key = _.invoke(item, keyPath);
      }
      if (!key) throw new Error(`Không tìm thấy key cho ${item}`);
      result[key] = value || item;
      return result;
    },
    {},
  );
}

export const replaceIdSlack = async text => {
  const allSlackIds = _.uniq(getSlackIdsFromMessage(text));

  const users = await Promise.all(
    _.map(allSlackIds, idSlack => {
      return getUserInfo(idSlack);
    }),
  );
  const usersMap = makeMap(users, 'id');

  let transformText = text;

  _.forEach(allSlackIds, slackId => {
    if (usersMap[slackId].real_name) {
      transformText = replaceAll(
        transformText,
        `<@${slackId}>`,
        `**@${usersMap[slackId].real_name}**`,
      );
    }
  });

  return transformText;
};
export const getThreadTS = action => {
  const { event } = action.body;
  return _.get(event, 'thread_ts', event.ts);
};

export const getMentionUser = ({ payload }) => {
  return payload.user;
};

export const replaceAll = (string, matchPattern, replacement) => {
  return string.split(matchPattern).join(replacement);
};

export const getTaggedUsers = text => {
  return text.match(/<@(.*?)>/gi);
};

export const getBotUserId = action => {
  return action.context.botUserId;
};
export const getBotId = action => {
  return action.context.botId;
};

export const helperMenu = action => {
  const mentionUser = getMentionUser(action);

  const helperPattern = [
    `<@${mentionUser}>`,
    '• *Tạo card*:',
    '*card* "Tên của card": *Bắt buộc*.',
    '*board* "Tên của Board": *Không bắt buộc* mặc định là *TECH*.',
    '*assign* @user1 @user2: *Bắt buộc khi type=3*.',
    '*type* [1,2,3] tương ứng [_minor_, _normal_, _critical_]: *Không bắt buộc*.\n',
    `*Ví dụ*: <@${getBotUserId(action)}>  type 2 card "This is a normal task."`,
    '• *Danh sách board*:',
    `<@${getBotUserId(action)}> boards`,
    '• *Trợ giúp*:',
    `<@${getBotUserId(action)}> help hoặc h`,
  ].join('\n');
  return helperPattern;
};
