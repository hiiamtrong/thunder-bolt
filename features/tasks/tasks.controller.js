import { createCard, moveCard } from '../../app/trello.js'
import { reply } from '../../helper.js'

function replyWrongPattern(action, type) {
  switch (type){
    case 'help':
      return reply(action, 'Cấu trúc câu lệnh task gồm \n*name* "..." assign @Truong type 1 board "..." \n(In *đậm* là bắt buộc, type có 3 loại 1/2/3))')
    case 'missing_id':
      return reply(action, 'Type 3 yêu cầu assign')
    case 'missing_require':
      return reply(action, 'Thiếu name roài nhé, gõ --help hoặc -h để được hướng dẫn')
    default:
      return reply(action, 'Gõ --h hoặc --help để được hướng dẫn nhé')
  }
}

export const mentionHandler = async (action) => {
  // handle mention of task
  // oi doi oi Young Mother lam phien toi qua hic (❁´◡`❁)
  const { text } = action.payload
  if(!text) {
    return replyWrongPattern(action)
  }
  const hasName = text.match(/name "(.*?)"/gi)
  const hasAssign = text.match(/assign <(.*?)>/gi)
  const hasType = text.match(/type \d/gi)
  const hasBoard = text.match(/board "(.*?)"/gi)
  const isHelp = text.match(/--help|--h/gi)
  if(isHelp){
    return replyWrongPattern(action, 'help')
  }
  if (hasName) {
    const name = hasName[0].replace(/"|name| /g, '')
    let assignId
    let type
    let board
    if(hasBoard){
      board = hasBoard[0].replace(/ |board|"/g, '')
    }
    if(hasAssign){
      assignId = text.match(/<@(.*?)>/gi)[0].replace(/<|>|@/g, '')
    }
    if(hasType){
      type = hasType[0].replace(/ |type/g, '')
    }
    if(type && !assignId){
      return replyWrongPattern(action, 'missing_id')
    }

    return reply(action, JSON.stringify({name, assignId, type, board}))
  }
  return replyWrongPattern(action, 'missing_require')
}
