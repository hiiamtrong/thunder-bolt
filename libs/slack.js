import bolt from '@slack/bolt';
import dayjs from 'dayjs';
import _ from 'lodash';
import mongoose from 'mongoose';
import config from '../configs/config.js';
import receiver from '../webhooks/index.js';
import { trello } from './trello.js';
const Card = mongoose.model('Card');
const User = mongoose.model('User');
const { App, LogLevel } = bolt;

export const app = new App({
  token: config.slack.token,
  socketMode: false,
  receiver,
  // developerMode: config.app.environment === 'dev' ? true : false,
  LogLevel: LogLevel.INFO,
});
export const getConversation = async ({ channel, ts }) => {
  try {
    const thread = await app.client.conversations.replies({
      channel,
      ts,
    });
    return thread.messages;
  } catch (error) {
    throw error;
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
  } catch (error) {
    throw error;
  }
};

export const getUserProfile = async user => {
  try {
    const res = await app.client.users.profile.get({
      user,
    });
    if (!res.ok) {
      throw new Error(res.error);
    }
    return res.profile;
  } catch (error) {
    throw error;
  }
};

export const postReacts = async ({ channel, ts, reacts }) => {
  try {
    return Promise.all(
      _.map(reacts, react => {
        return app.client.reactions.add({
          channel,
          timestamp: ts,
          name: react,
        });
      }),
    );
  } catch (error) {
    throw error;
  }
};
export const getBotInfo = async botId => {
  return app.client.bots.info({ bot: botId });
};

export const replyInThread = async ({ channel, text, thread_ts }) => {
  try {
    return app.client.chat.postMessage({
      channel,
      text,
      thread_ts,
    });
  } catch (error) {
    throw error;
  }
};

export const handleChangeDueDate = async ({ due, name, type, id }) => {
  const card = await Card.findOne({ idCard: id })
    .select('threadTs channel')
    .lean();
  if (!card) {
    throw new Error('Kh??ng t??m th???y card');
  }
  const day = dayjs(due).format('DD/MM/YYYY HH:mm');
  const reply =
    type === 'action_changed_a_due_date'
      ? [
          `:calendar: Task *${name}* ???? thay ?????i deadline.`,
          `Th???i gian d??? ki???n ho??n th??nh m???i s??? v??o *${day}*.\n`,
          `:bell: B???n s??? nh???n ???????c th??ng b??o khi task ho??n th??nh.`,
        ]
      : [
          `:calendar: Task *${name}* d??? ki???n s??? ho??n th??nh v??o *${day}*.`,
          '\n:bell: B???n s??? nh???n ???????c th??ng b??o khi task ho??n th??nh.',
        ];
  return replyInThread({
    channel: card.channel,
    text: reply.join('\n'),
    thread_ts: card.threadTs,
  });
};

export const handleAddAssignUser = async action => {
  const trelloUser = _.get(
    action,
    'body.state.values.trello_user.select_user_trello.selected_option.value',
  );
  const slackUser = _.get(
    action,
    'body.state.values.slack_user.select_user_slack.selected_user',
  );

  const cardSection = _.find(_.get(action, 'body.message.blocks'), block => {
    return block.block_id === 'card_id';
  });

  const messageTs = _.get(action, 'body.container.message_ts');
  console.log(_.get(action, 'body'));
  const channel = _.get(action, 'body.container.channel_id');

  if (!slackUser || !trelloUser) {
    return action.client.chat.update({
      channel,
      ts: messageTs,
      text: ':warning: Ch??a ch???n trello user ho???c slack user !',
      blocks: [
        ...action.body.message.blocks,
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: ':x: Ch??a ch???n trello user ho???c slack user !',
          },
        },
      ],
    });
  }

  const cardId = _.replace(
    _.get(cardSection, 'text.text').match(/:\*(\w+)\*/gi),
    /[\*:]/gi,
    '',
  );

  await Promise.all([
    User.updateOne({ idTrello: trelloUser }, { $set: { idSlack: slackUser } }),
    trello.addMemberToCard(cardId, trelloUser),
    action.client.chat.update({
      channel,
      ts: messageTs,
      text: ':white_check_mark: ?????ng b??? ng?????i d??ng th??nh c??ng',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: ':white_check_mark: ?????ng b??? ng?????i d??ng th??nh c??ng',
          },
        },
      ],
    }),
  ]);
};

export default app;
