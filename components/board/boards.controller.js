import asyncHandler from 'express-async-handler';
import { listBoards } from '../../libs/trello.js';
import mongoose from 'mongoose';
const Board = mongoose.model('Board');
export default {
  list: asyncHandler(async () => {
    const boards = await Board.find({}).select('code idBoard').sort('name');
    const trelloBoards = await listBoards();
    return [boards, trelloBoards];
  }),
};
