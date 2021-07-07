import _ from 'lodash'
import Board from '../../components/board/board.model.js'
import cardController from '../../components/card/card.controller.js'
import User from '../../components/user/user.model.js'
import { getConversation, react } from '../../libs/slack.js'
import { addComment, createCard } from '../../libs/trello.js'
import {
  getBotUserId,
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
    '*type* [1,2,3] tương ứng [_minor_, _normal_, _critical_]: *Không bắt buộc*.\n',
    `*Ví dụ*: <@${getBotUserId(action)}>  type 2 name "This is a normal task."`,
    '• *Trợ giúp*',
    `<@${getBotUserId(action)}> *help*/*h*`,
  ].join('\n')

  switch (type) {
    case 'help':
    case 'missing_require':
      return reply(action, helperPattern)
    case 'missing_id':
      return reply(action, `<@${mentionUser}> Type *critical* yêu cầu assign`)
    case 'missing_require':
      return reply(
        action,
        `<@${mentionUser}> Thiếu name roài nhé, gõ help hoặc h để được hướng dẫn`
      )
    default:
      return reply(
        action,
        `<@${mentionUser}> Gõ h hoặc help để được hướng dẫn nhé`
      )
  }
}

export const mentionHandler = async (action) => {
  // handle mention of task
  // chi muon ngay nang len de dc gap em, quen di moi uu phien moi khi em ve
  const { text } = action.payload
  if (_.trim(text).length === 14) {
    return replyWrongPattern(action)
  }

  const helpRE = new RegExp(`\^<@${getBotUserId(action)}>\\s+help|h\$`, 'gi')
  const isHelp = text.match(helpRE)

  if (isHelp) {
    return replyWrongPattern(action, 'help')
  }

  const matchName = text.match(/name "(.*?)"/gi)
  if (matchName) {
    return createTask(action, matchName)
  }
}

export const createTask = async (action, matchName) => {
  const { text, channel } = action.payload

  const hasAssign = text.match(/assign\s(<@\w.*> ?)+/gi)
  const hasType = text.match(/type \d/gi)
  const hasBoard = text.match(/board "(.*?)"/gi)

  const name = _.trim(matchName[0].replace(/"|name/g, ''))
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

  if (type === 3 && !_.get(assignIds, 'length')) {
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

  const messages = await getConversation({ channel, ts: getThreadTS(action) })

  let message = _.map(messages, 'text').join('\n')
  const transformMessage = await replaceIdSlack(message)
  console.log(transformMessage)
  return Promise.all([
    reply(
      action,
      [
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
      ].join('\n')
    ),
    react({
      channel,
      ts: getThreadTS(action),
      reacts: ['card_index'],
    }),
    addComment({ idCard: resCard.idCard, text: transformMessage }),
  ])
}
