import { Router } from 'express';

const router = Router();
router.get('/webhook/trello', async (req, res) => {
  console.log(req);
  res.json(req.body);
});

router.post('/webhook/trello', async (req, res) => {
  //handle web hook trello
  console.log(req.body);
  res.json(req.body);
});
export default router;
