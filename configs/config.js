import dotenv from 'dotenv'
dotenv.config()

export default {
  app: {
    name: process.env.APP_NAME,
    port: process.env.PORT || 1235,
    environment: process.env.NODE_ENV,
  },
  mongo: {
    port: process.env.DB_PORT || 27017,
    host: process.env.DB_HOST || 'localhost',
    name: process.env.DB_NAME || 'thunder-bolt',
  },
  slack: {
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.APP_TOKEN,
  },
  trello: {
    apiKey: process.env.TRELLO_APPLICATION_KEY,
    token: process.env.TRELLO_TOKEN,
  },
}