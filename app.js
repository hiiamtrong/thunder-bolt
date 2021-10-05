import config from './configs/config.js';
import './configs/database.js';
import { mentionHandler } from './features/tasks/tasks.controller.js';
import app, { handleAddAssignUser } from './libs/slack.js';
import { helperMenu } from './ultis/helper.js';
import logger from './ultis/logger.js';

app.error(error => {
  return logger.error(error.stack || error.message || JSON.stringify(error));
});

app.event('app_mention', async action => {
  await mentionHandler(action);
});

app.command('/help', async action => {
  await action.ack();
  return action.say(helperMenu(action));
});

app.action('add_assign_user', async action => {
  await action.ack();
  await handleAddAssignUser(action);
});

(async () => {
  const PORT = config.app.port || 3000;
  await app.start(PORT);
  console.log(`⚡️ Bolt app is running at port ${PORT}!`);
})();
