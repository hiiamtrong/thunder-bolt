import Trello from 'node-trello'
import dotenv from 'dotenv'
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
  return trello.put(`/1/cards/${cardId}`, {
    idList,
  })
}
