import axios from 'axios';
import Trello from 'trello';
import config from '../configs/config.js';
import { replyInThread } from './slack.js';
import Card from '../components/card/card.model.js';
import List from '../components/list/list.model.js';

export const trello = new Trello(config.trello.apiKey, config.trello.token);

export const createCard = ({ name, idList, desc, labels, idMembers }) => {
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
      idMembers,
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

export const createWebhook = async ({ idModel, description, callbackURL }) => {
  return trello.addWebhook(description, callbackURL, idModel);
};

export const handlePostWebhook = async ({ id, type }) => {
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
