import { Router } from 'express';
import { getCardFromLink } from '../libs/trello.js';

const router = Router();
router.post('/webhook/gitlab', async (req, res) => {
  // You're working with an express req and res now.
  const { object_attributes } = req.body;
  const { description, work_in_progress, state, url } = object_attributes;

  const cardTrello = description.match(
    /(?:https?:\/\/)?(?:[^.]+\.)?trello\.com(\/[-a-zA-Z0-9(@:%_\+.~#?&//=]*)?/gi,
  );

  const card = await getCardFromLink(cardTrello + '.json');
  console.log({ description, work_in_progress, state, url });
  console.log(card);
  res.json(req.body);
});
export default router;
