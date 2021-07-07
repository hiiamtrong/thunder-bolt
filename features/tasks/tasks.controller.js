import _ from 'lodash'
import Board from '../../components/board/board.model.js'
import cardController from '../../components/card/card.controller.js'
import User from '../../components/user/user.model.js'
import { getConversation } from '../../libs/slack.js'
import { addComment, createCard } from '../../libs/trello.js'
import {
  getMentionUser,
  getSlackIdsFromMessage,
  getThreadTS,
  replaceIdSlack,
  reply,
} from '../../ultis/helper.js'

function replyWrongPattern(action, type) {
  const mentionUser = getMentionUser(action)

  const helperPattern = [
    `<@${mentionUser}>`,
    '• *Tạo card*',
    '*name* "Tên của card": *Bắt buộc*.',
    '*board* "Tên của Board": *Không bắt buộc* mặc định là *TECH*.',
    '*assign* @user1 @user2: *Bắt buộc khi type=3*.',
    '*type* [1,2,3]: *Không bắt buộc*.\n',
    '*Ví dụ*: @taskbot type=2 name "This is a normal task."',
    '• *Trợ giúp*',
    '@taskbot *help*/*h*',
  ].join('\n')

  switch (type) {
    case 'help':
    case 'missing_require':
      return reply(action, helperPattern)
    case 'missing_id':
      return reply(action, 'Type 3 yêu cầu assign')
    case 'missing_require':
      return reply(
        action,
        'Thiếu name roài nhé, gõ help hoặc h để được hướng dẫn'
      )
    default:
      return reply(action, 'Gõ h hoặc help để được hướng dẫn nhé')
  }
}

export const mentionHandler = async (action) => {
  // handle mention of task
  // chi muon ngay nang len de dc gap em, quen di moi uu phien moi khi em ve

  const { text, channel, thread_ts } = action.payload
  if (_.trim(text).length === 14) {
    return replyWrongPattern(action)
  }
  const hasName = text.match(/name "(.*?)"/gi)
  const hasAssign = text.match(/assign\s(<@\w.*> ?)+/gi)
  const hasType = text.match(/type \d/gi)
  const hasBoard = text.match(/board "(.*?)"/gi)
  const isHelp = text.match(/^help|^h/gi)

  if (isHelp) {
    return replyWrongPattern(action, 'help')
  }
  if (hasName) {
    const name = _.trim(hasName[0].replace(/"|name/g, ''))
    let board = 'TECH'
    let assignIds = []
    let type
    if (hasBoard) {
      board = _.trim(hasBoard[0].replace(/board|"/g, ''))
    }

    if (_.get(hasAssign, 'length')) {
      const matchText = hasAssign[0]
      assignIds = getSlackIdsFromMessage(matchText)
    }
    if (hasType) {
      type = _.trim(hasType[0].replace(/type/g, ''))
    }

    if (type && !_.get(assignIds, 'length')) {
      return replyWrongPattern(action, 'missing_id')
    }

    if (_.get(assignIds, 'length')) {
      const matchAssignUser = await User.find({ idSlack: { $in: assignIds } })
        .select('idTrello')
        .lean()
      assignIds = _.map(matchAssignUser, 'idTrello')
    }

    const matchBoard = await Board.findOne({ code: board })
      .populate('defaultList', 'idList')
      .lean()
    const card = await createCard({
      name,
      idList: matchBoard.defaultList.idList,
      idMembers: assignIds,
    })

    const resCard = await cardController.create({
      ...card,
      threadTs: getThreadTS(action),
    })

    if (!resCard) {
      return reply(action, 'Có lỗi hok mong mún :<')
    }

    const messages = await getConversation({ channel, ts: thread_ts })

    let text = _.map(messages, 'text').join('\n')
    text = await replaceIdSlack(text)
    await addComment({ idCard: resCard.idCard, text })
    return reply(
      action,
      `Tạo card thành công (<${resCard.url}|Trello>) ${
        hasAssign ? hasAssign.join('').replace('assign', '') : ''
      }`
    )
  }
  return replyWrongPattern(action, 'missing_require')
}
