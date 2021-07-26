import _ from 'lodash';
import mongoose from 'mongoose';
const Board = mongoose.model('Board');
import boardsController from '../../components/board/boards.controller.js';
import cardController from '../../components/card/card.controller.js';
import config from '../../configs/config.js';
import { getConversation, postReacts } from '../../libs/slack.js';
import {
  addAssignUser,
  addComment,
  createCard,
  createWebhook,
} from '../../libs/trello.js';
import {
  getBotUserId,
  getMentionUser,
  getSlackIdsFromMessage,
  getThreadTS,
  helperMenu,
  makeMap,
  replaceIdSlack,
  reply,
} from '../../ultis/helper.js';

function replyWrongPattern(action, type) {
  const mentionUser = getMentionUser(action);

  switch (type) {
    case 'help':
    case 'missing_require':
      return reply({ action, text: helperMenu(action), reply_broadcast: true });
    case 'missing_id':
      return reply({
        action,
        text: `<@${mentionUser}> :warning: Type *critical* yêu cầu assign`,
        reply_broadcast: true,
      });
    default:
      return reply({
        action,
        text: `<@${mentionUser}> :warning: Lệnh không tồn tại, gõ h hoặc help để được hướng dẫn nhé`,
        reply_broadcast: true,
      });
  }
}

export const mentionHandler = async action => {
  try {
    const { text } = action.payload;
    if (_.trim(text).length === 14) {
      return replyWrongPattern(action);
    }

    const helpRE = new RegExp(`\^<@${getBotUserId(action)}>\\s+help|h\$`, 'gi');
    const isHelp = text.match(helpRE);

    if (isHelp) {
      return replyWrongPattern(action, 'help');
    }

    const matchName = text.match(/card ["““](.*?)["””]/gi);
    if (matchName) {
      return createTask(action, matchName);
    }
    const boardRE = new RegExp(
      `\^<@${getBotUserId(action)}>\\s+boards\s*\$`,
      'gi',
    );
    const boardCmd = text.match(boardRE);
    if (boardCmd) {
      return listBoard(action, boardCmd);
    }

    return replyWrongPattern(action);
  } catch (error) {
    return reply({ action, text: error.message, reply_broadcast: true });
  }
  // handle mention of task
  // chi muon ngay nang len de dc gap em, quen di moi uu phien moi khi em ve
};

export const createTask = async (action, matchName) => {
  try {
    const { text, channel } = action.payload;

    const hasAssign = text.match(/assign\s(<@\w.*> ?)+/gi);
    const hasType = text.match(/type \d/gi);
    const hasBoard = text.match(/board ["“”](.*?)["“”]/gi);

    const name = _.trim(matchName[0].replace(/["“”]|card/g, ''));
    let board = 'TECH';
    let assignId = null;
    let type;

    if (hasBoard) {
      board = _.trim(hasBoard[0].replace(/board|["“”]/g, ''));
    }

    if (_.get(hasAssign, 'length')) {
      const matchText = hasAssign[0];
      assignId = _.get(getSlackIdsFromMessage(matchText), '0');
    }

    if (hasType) {
      type = _.trim(hasType[0].replace(/type/g, ''));
    }

    if (+type === 3 && !_.get(assignId, 'length')) {
      return replyWrongPattern(action, 'missing_id');
    }

    const boardRegex = new RegExp(`\^${board}\$`, 'gi');
    const matchBoard = await Board.findOne({ code: boardRegex })
      .populate('defaultList', 'idList')
      .populate('specialLabels.label', 'idLabel')
      .lean();
    if (!matchBoard) {
      throw new Error(
        `:warning: Không tìm thấy board trong CSDL!\nSử dụng lệnh: <@${getBotUserId(
          action,
        )}> boards để xem các bảng hiện có!`,
      );
    }

    const matchLabel = _.find(_.get(matchBoard, 'specialLabels'), label => {
      return label.code === +type;
    });

    let labels = [];
    if (matchLabel) {
      labels = [_.get(matchLabel, 'label.idLabel')];
    }

    const card = await createCard({
      name,
      idList: _.get(matchBoard, 'defaultList.idList'),
      labels,
    });

    const resCard = await cardController.create({
      ...card,
      threadTs: getThreadTS(action),
      channel,
    });

    if (!resCard) {
      return reply({
        action,
        text: `<@${getMentionUser(action)}> :warning: Có lỗi xảy ra :<`,
      });
    }

    const messages = await getConversation({
      channel,
      ts: getThreadTS(action),
    });
    let message = _.map(messages, message => {
      const { user, text } = message;
      return `<@${user}>: ${text}`;
    }).join('\n');
    const transformMessage = await replaceIdSlack(message);

    const shouldDo = [
      replyAfterCreate(action, card, hasAssign),
      postReacts({
        channel,
        ts: getThreadTS(action),
        reacts: ['card_index'],
      }),
      addComment({ idCard: resCard.idCard, text: transformMessage }),
      createWebhook({
        idModel: card.id,
        description: card.mshortUrl,
        callbackURL: `${config.trello.callbackBaseURL}/webhook/trello/cards`,
      }),
    ];
    if (hasAssign) {
      shouldDo.push(
        addAssignUser({
          idCard: resCard.idCard,
          user: assignId,
          action,
        }),
      );
    }

    return Promise.all(shouldDo).catch(error => {
      if (error.message.includes('already_reacted')) {
        return;
      }
      return reply({
        action,
        text: `<@${getMentionUser(action)}> ${
          error.message || JSON.stringify(error)
        }`,
      });
    });
  } catch (error) {
    return reply({
      action,
      text: `<@${getMentionUser(action)}> ${
        error.message || JSON.stringify(error)
      }`,
    });
  }
};

const listBoard = async action => {
  const [boards, trelloBoards] = await boardsController.list();
  if (!boards.length) {
    return reply({
      action,
      text: `<@${getMentionUser(
        action,
      )}> :warning: Chưa có bảng nào trong cơ sở dữ liệu, liên hệ team Tech để thêm nhé !`,
    });
  }
  const trelloBoardsMap = makeMap(trelloBoards, 'id');
  const boardsText = _.sortBy(
    _.map(boards, board => {
      const matchBoardTrello = trelloBoardsMap[_.get(board, 'idBoard')];
      if (matchBoardTrello) {
        return `*• <${matchBoardTrello.url}|${_.get(board, 'code')}>*`;
      }
      return `*• ${_.get(board, 'code')}*`;
    }),
  ).join('\n');
  return reply({
    action,
    text: `<@${getMentionUser(
      action,
    )}> Danh sách board hiện có:\n ${boardsText}`,
  });
};

function replyAfterCreate(action, card, hasAssign) {
  return reply({
    action,
    text: [
      `<@${getMentionUser(action)}>`,
      `:ok_hand: Tạo card thành công!`,
      `:card_index: Id Card: ${card.shortLink}`,
      `:link: Link: ${card.shortUrl}`,
      `${
        hasAssign
          ? `:bust_in_silhouette: Assign: ${hasAssign
              .join('')
              .replace('assign', '')}`
          : ''
      }`,
    ].join('\n'),
  });
}
