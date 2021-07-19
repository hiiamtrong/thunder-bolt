import asyncHandler from 'express-async-handler';
import Board from './board.model.js';
export default {
  list: asyncHandler(async () => {
    const boards = await Board.find({}).select('code').sort('name');
    return boards;
  }),
};
