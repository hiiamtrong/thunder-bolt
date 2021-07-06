import cardController from '../../components/card/card.controller.js'
import {
  getMentionUser,
  getThreadTS,
  replaceAll,
  reply,
} from '../../ultis/helper.js'
import { createCard } from '../../libs/trello.js'

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
    '@taskbot *help*',
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
        'Thiếu name roài nhé, gõ --help hoặc -h để được hướng dẫn'
      )
    default:
      return reply(action, 'Gõ --h hoặc --help để được hướng dẫn nhé')
  }
}

export const mentionHandler = async (action) => {
  // handle mention of task
  // oi doi oi Young Mother lam phien toi qua hic (❁´◡`❁)
  const { text } = action.payload
  if (_.trim(text).length === 14) {
    return replyWrongPattern(action)
  }
  const hasName = text.match(/name "(.*?)"/gi)
  const hasAssign = text.match(/assign\s(<@\w.*> ?)+/gi)
  const hasType = text.match(/type \d/gi)
  const hasBoard = text.match(/board "(.*?)"/gi)
  const isHelp = text.match(/--help|--h/gi)

  if (isHelp) {
    return replyWrongPattern(action, 'help')
  }

  if (hasName) {
    const name = hasName[0].replace(/"|name| /g, '')
    let assignIds
    let type
    let board
    if (hasBoard) {
      board = hasBoard[0].replace(/ |board|"/g, '')
    }

    if (hasAssign.length) {
      assignIds = replaceAll(
        hasAssign[0].match(/<@(.*?)>/gi).join(' '),
        /[<@>]/,
        ''
      ).split(/\s+/)
    }

    if (hasType) {
      type = hasType[0].replace(/ |type/g, '')
    }

    if (type && !assignIds.length) {
      return replyWrongPattern(action, 'missing_id')
    }

    const idList = '60e4810ce0d14d7bedc7b8ed'
    const card = await createCard({ name, idList })

    await cardController.create({ ...card, threadTs: getThreadTS(action) })
    return reply(action, JSON.stringify({ name, assignId, type, board }))
  }
  return replyWrongPattern(action, 'missing_require')
}
