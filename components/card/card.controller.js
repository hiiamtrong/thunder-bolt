import asyncHandler from 'express-async-handler';
import Card from './card.model.js';
export default {
  create: asyncHandler(async body => {
    const { id, name, desc, shortUrl, threadTs, channel } = body;
    const card = new Card({
      idCard: id,
      name,
      description: desc,
      url: shortUrl,
      threadTs,
      channel,
    });
    await card.save();
    return card;
  }),
};
