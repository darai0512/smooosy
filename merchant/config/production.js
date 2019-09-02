require('dotenv').config()

module.exports = {
  port: 3232,
  mongodb: {
    uri: `mongodb+srv://smooosy:${process.env.MONGODB_PASSWORD}@smooosy-production-bre4f.mongodb.net/smooosy`,
  },
}
