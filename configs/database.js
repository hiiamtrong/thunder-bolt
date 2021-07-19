import mongoose from 'mongoose';
import logger from '../ultis/logger.js';
import config from './config.js';
const { mongo } = config;
mongoose.Promise = global.Promise;

mongoose.connect(mongo.url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const { connection } = mongoose;

connection.on('connected', () =>
  logger.info('Database Connection was Successful'),
);
connection.on('error', err => logger.error('Database Connection Failed' + err));

connection.on('disconnected', () =>
  logger.info('Database Connection Disconnected'),
);

process.on('SIGINT', () => {
  connection.close();
  logger.info('Database Connection closed due to NodeJs process termination');
  process.exit(0);
});
import('../components/list/list.model.js');
import('../components/board/board.model.js');
import('../components/user/user.model.js');
import('../components/card/card.model.js');
import('../components/label/label.model.js');
