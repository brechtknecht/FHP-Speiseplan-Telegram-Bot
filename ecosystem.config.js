require('dotenv').config()

module.exports = {
    apps : [{
      name   : "FHP-Speiseplan-Bot",
      script : "BOT_TOKEN=" + process.env.BOT_TOKEN + " npm start"
    }]
  }
  