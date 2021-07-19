import { Router } from 'express';
import _ from 'lodash';
import { handleChangeDueDate } from '../libs/slack.js';
const router = Router();
router.get('/webhook/trello', async (req, res) => {
  res.json(req.body);
});

router.post('/webhook/trello', async (req, res) => {
  //handle web hook trello
  const displayAction = _.get(req.body, 'action.display.translationKey', '');
  if (
    _.includes(
      ['action_changed_a_due_date', 'action_added_a_due_date'],
      displayAction,
    )
  ) {
    const { due, name, id } = req.body.model;
    await handleChangeDueDate({ due, name, type: displayAction, id });
  }
  res.json(req.body);
});
export default router;
