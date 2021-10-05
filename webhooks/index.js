import bolt from '@slack/bolt';
import errorhandler from 'errorhandler';
import express from 'express';
import config from '../configs/config.js';
import logger from '../ultis/logger.js';
import gitlab from './gitlab.webhook.js';
import trello from './trello.webhook.js';

const receiver = new bolt.ExpressReceiver({
  signingSecret: config.slack.signingSecret,
});

receiver.router.use(express.json());
receiver.router.use(express.urlencoded({ extended: true }));
receiver.app.get('/', (req, res) => {
  res.send('<h2>⚡️ Thunder Bolt app is running</h2>');
});
receiver.router.use(gitlab);
receiver.router.use(trello);

receiver.router.use(errorhandler({ log: errorNotification }));

// eslint-disable-next-line no-unused-vars
function errorNotification(err, str, req) {
  return logger.error(err.stack || err.message || JSON.stringify(err));
}

export default receiver;
