import bolt from '@slack/bolt';
import config from '../configs/config.js';
import receiver from '../webhooks/index.js';
import dayjs from 'dayjs';
import Card from '../components/card/card.model.js';
const { App, LogLevel } = bolt;
import _ from 'lodash';

export const app = new App({
  token: config.slack.token,
  socketMode: false,
  receiver,
  // developerMode: config.app.environment === 'dev' ? true : false,
  // LogLevel: LogLevel.DEBUG,
  // appToken: config.slack.appToken,
});
export const getConversation = async ({ channel, ts }) => {
  try {
    const thread = await app.client.conversations.replies({
      channel,
      ts,
    });
    return thread.messages;
  } catch (err) {
    throw err;
  }
};
export const getUserInfo = async user => {
  try {
    const res = await app.client.users.info({
      user,
    });
    if (!res.ok) {
      throw new Error(res.error);
    }
    return res.user;
  } catch (err) {
    throw err;
  }
};

export const postReacts = async ({ channel, ts, reacts }) => {
  return Promise.all(
    _.map(reacts, react => {
      return app.client.reactions.add({ channel, timestamp: ts, name: react });
    }),
  );
};
export const getBotInfo = async botId => {
  return app.client.bots.info({ bot: botId });
};

export const replyInThread = async ({ channel, text, thread_ts }) => {
  return app.client.chat.postMessage({
    channel,
    text,
    thread_ts,
  });
};

export const handleMergedGitLab = async ({ id }) => {
  const card = await Card.findOne({ idCard: id })
    .select('threadTs channel name')
    .lean();
  if (!card) {
    throw new Error('Không tìm thấy card');
  }
  const reply = `:tech: Task *${card.name}* đã được làm xong rồi nhé!`;

  return replyInThread({
    channel: card.channel,
    text: reply,
    thread_ts: card.threadTs,
  });
};

export const handleChangeDueDate = async ({ due, name, type, id }) => {
  const card = await Card.findOne({ idCard: id })
    .select('threadTs channel')
    .lean();
  if (!card) {
    throw new Error('Không tìm thấy card');
  }
  const day = dayjs(due).format('DD/MM/YYYY HH:mm');
  const reply =
    type === 'action_changed_a_due_date'
      ? [
          `:calendar: Task ${name} đã thay đổi deadline.`,
          `Thời gian dự kiến hoàn thành mới sẽ vào ${day}.\n`,
          `:bell: Bạn sẽ nhận được thông báo khi task hoàn thành.`,
        ]
      : [
          `:calendar: Task *${name}* dự kiến sẽ hoàn thành vào *${day}*.`,
          '\n:bell: Bạn sẽ nhận được thông báo khi task hoàn thành.',
        ];
  return replyInThread({
    channel: card.channel,
    text: reply.join('\n'),
    thread_ts: card.threadTs,
  });
};
export default app;
