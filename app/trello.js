import Trello from 'trello'
import dotenv from 'dotenv'
import axios from 'axios'
dotenv.config()

export const trello = new Trello(
  process.env.TRELLO_APPLICATION_KEY,
  process.env.TRELLO_TOKEN
)

export const createCard = ({ name, idList, desc, labels }) => {
  try {
    const sample = {
      desc: `## Goal
            ## Current Situation
            ## Expectation
            ## Deadline
            ## Input
            ## Test`,
    }
    return trello.makeRequest('post', '/1/cards', {
      name,
      desc: desc || sample.desc,
      idList,
      labels,
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
    .get(
      `${link}?key=${process.env.TRELLO_APPLICATION_KEY}&token=${process.env.TRELLO_TOKEN}`
    )
    .catch((error) => {
      throw error
    })
  return res.data
}
