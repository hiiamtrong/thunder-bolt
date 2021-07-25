import { Router } from 'express';
import _ from 'lodash';
import { handleChangeDueDate } from '../libs/slack.js';
import { handleAddMemberToBoard } from '../libs/trello.js';
const router = Router();
router.get('/webhook/trello/cards', async (req, res) => {
  res.json(req.body);
});

router.post('/webhook/trello/cards', async (req, res) => {
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

router.get('/webhook/trello/boards', async (req, res) => {
  res.json(req.body);
});

router.post('/webhook/trello/boards', async (req, res) => {
  // handle web hook trello
  const displayAction = _.get(req.body, 'action.display.translationKey', '');
  if (_.includes(['action_added_member_to_board'], displayAction)) {
    const { member } = req.body.action;
    await handleAddMemberToBoard({ member });
  }

  res.json(req.body);
});
export default router;
