import _ from 'lodash'
import Board from '../../components/board/board.model.js'
import cardController from '../../components/card/card.controller.js'
import User from '../../components/user/user.model.js'
import { getConversation, postReacts } from '../../libs/slack.js'
import { addComment, createCard } from '../../libs/trello.js'
import {
  getBotUserId,
  getMentionUser,
  getSlackIdsFromMessage,
  getThreadTS,
  helperMenu,
  replaceIdSlack,
  reply,
} from '../../ultis/helper.js'

function replyWrongPattern(action, type) {
  const mentionUser = getMentionUser(action)

  switch (type) {
    case 'help':
    case 'missing_require':
      return reply(action, helperMenu(action))
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

  if (+type === 3 && !_.get(assignIds, 'length')) {
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
    .populate('specialLabels.label', 'idLabel')
    .lean()

  const matchLabel = _.find(_.get(matchBoard, 'specialLabels'), (label) => {
    return label.code === +type
  })

  let labels = []
  if (matchLabel) {
    labels = [_.get(matchLabel, 'label.idLabel')]
  }

  const card = await createCard({
    name,
    idList: matchBoard.defaultList.idList,
    idMembers: assignIds,
    labels,
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
    postReacts({
      channel,
      ts: getThreadTS(action),
      reacts: ['card_index'],
    }),
    addComment({ idCard: resCard.idCard, text: transformMessage }),
  ])
}
