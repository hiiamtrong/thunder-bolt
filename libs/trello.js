import axios from 'axios'
import Trello from 'trello'
import config from '../configs/config.js'

export const trello = new Trello(config.trello.apiKey, config.trello.token)

export const createCard = ({ name, idList, desc, labels }) => {
  try {
    const sample = {
      desc: `## Goal\n## Current Situation\n## Expectation\n## Deadline\n## Input\n## Test`,
    }
    return trello.post('/1/cards', {
      name,
      idList,
      desc: desc || sample.desc,
      pos: 'bottom',
      idLabels: labels,
    })
  } catch (error) {
    throw error
  }
}

export const moveCard = ({ cardId, idList }) => {
  return trello.makeRequest('put', `/1/cards/${cardId}`, { idList })
}

export const getCardFromLink = async (link) => {
  const res = await axios
    .get(`${link}?key=${config.trello.apiKey}&token=${config.trello.token}`)
    .catch((error) => {
      throw error
    })
  return res.data
}
