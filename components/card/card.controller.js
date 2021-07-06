import asyncHandler from 'express-async-handler'
import Card from './card.model.js'
export default {
  create: asyncHandler(async (body) => {
    const { id, name, desc, shortUrl, threadTs } = body
    const card = new Card({
      cardId: id,
      name,
      description: desc,
      url: shortUrl,
      threadTs,
    })
    await card.save()
    return card
  }),
}
