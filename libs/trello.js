import axios from 'axios';
import Trello from 'trello';
import config from '../configs/config.js';

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
