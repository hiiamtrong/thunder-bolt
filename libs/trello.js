import axios from 'axios';
import _ from 'lodash';
import mongoose from 'mongoose';
import Trello from 'trello';
import config from '../configs/config.js';
import { replyInThread } from './slack.js';
const Card = mongoose.model('Card');
const List = mongoose.model('List');
const User = mongoose.model('User');

export const trello = new Trello(config.trello.apiKey, config.trello.token);

export const createCard = ({ name, idList, desc, labels }) => {
  try {
    const sample = {
      desc: `## Goal\n## Current Situation\n## Expectation\n## Deadline\n## Input\n## Test`,
    };
    return trello.makeRequest('post', '/1/cards', {
      name,
      idList,
      desc: desc || sample.desc,
      pos: 'bottom',
      idLabels: labels,
    });
  } catch (error) {
    throw error;
  }
};

export const moveCard = ({ idCard, idList }) => {
  return trello.updateCardList(idCard, idList);
};

export const getCardFromLink = async link => {
  const res = await axios
    .get(`${link}?key=${config.trello.apiKey}&token=${config.trello.token}`)
    .catch(error => {
      throw error;
    });
  return res.data;
};

export const addComment = async ({ idCard, text }) => {
  try {
    return trello.addCommentToCard(idCard, text);
  } catch (err) {
    throw err;
  }
};

export const addAssignUser = async ({ idCard, user }) => {
  try {
    if (!user) {
      throw new Error(
        ':warning: Chưa có assign users nên mình chưa thêm vào card nhé ! ',
      );
    }

    const matchAssignUser = await User.findOne({ idSlack: user })
      .select('idTrello')
      .lean();

    if (_.get(matchAssignUser, 'idTrello')) {
      return trello.addMemberToCard(idCard, matchAssignUser.idTrello);
    } else {
      throw new Error(
        `:warning: Không tìm thấy người dùng trong CSDL! Vui lòng liên hệ team Tech để thêm nhé`,
      );
    }

    // const slackUser = await getUserProfile(user);
    // if (!slackUser) {
    //   throw new Error(
    //     ':warning: Không tìm thấy assign users nên mình chưa thêm vào card nhé ! ',
    //   );
    // }
  } catch (error) {
    throw error;
  }
};

export const createWebhook = async ({ idModel, description, callbackURL }) => {
  try {
    return trello.addWebhook(description, callbackURL, idModel);
  } catch (error) {
    throw error;
  }
};
export const deleteWebhook = ({ idWebhook }) => {
  try {
    return trello.deleteWebhook(idWebhook);
  } catch (error) {
    throw error;
  }
};

export const listBoards = async () => {
  try {
    return trello.getBoards(config.trello.botId);
  } catch (error) {
    throw error;
  }
};

export const handlePostWebhookCard = async ({ id, type }) => {
  const card = await Card.findOne({ idCard: id })
    .select('threadTs channel name')
    .lean();
  if (!card) {
    throw new Error('Không tìm thấy card');
  }
  switch (type) {
    case 'MERGED':
      const listDone = await List.findOne({ name: 'Done' })
        .select('idList')
        .lean();
      const reply = `:tech: Task *${card.name}* đã được làm xong rồi nhé!`;
      return Promise.all([
        replyInThread({
          channel: card.channel,
          text: reply,
          thread_ts: card.threadTs,
        }),
        moveCard({
          idCard: id,
          idList: listDone.idList,
        }),
      ]);
    case 'OPENED':
      const listQC = await List.findOne({ name: 'QC' }).select('idList').lean();
      return moveCard({
        idCard: id,
        idList: listQC,
      });
    case 'DRAFT':
      const listEdit = await List.findOne({ name: 'Edit' })
        .select('idList')
        .lean();
      return moveCard({
        idCard: id,
        idList: listEdit,
      });
    default:
      throw new Error('Unknown Type Webhook!');
  }
};

export const handleAddMemberToBoard = async ({ member }) => {
  const isExists = await User.findOne({ idTrello: member.id });
  if (isExists) {
    return isExists;
  }
  const user = new User({ ...member, idTrello: member.id });
  return user.save();
};
