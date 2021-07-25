import _ from 'lodash';
import mongoose from 'mongoose';
import config from '../configs/config.js';
import '../configs/database.js';
import { createWebhook, deleteWebhook, listBoards } from '../libs/trello.js';
import logger from '../ultis/logger.js';

const Webhook = mongoose.model('Webhook');

listBoards()
  .then(async boards => {
    const existsWebhooks = await Webhook.find({
      idModel: { $in: _.map(boards, 'id') },
      active: true,
    });
    await Promise.all(
      _.map(existsWebhooks, webhook => {
        return deleteWebhook(webhook.idWebhook);
      }),
    );
    await Webhook.updateMany(
      { _id: { $in: _.map(existsWebhooks, '_id') } },
      {
        $set: {
          active: false,
        },
      },
    );
    return Promise.all(
      _.map(boards, async board => {
        const webhook = await createWebhook({
          idModel: board.id,
          description: board.name,
          callbackURL: `${config.trello.callbackBaseURL}/webhook/trello/boards`,
        });
        const newWebhook = new Webhook({
          ...webhook,
          idWebhook: webhook.id,
        });
        return newWebhook.save();
      }),
    ).catch(err => {
      return logger.error(err);
    });
  })
  .catch(err => {
    return logger.error(err);
  });
