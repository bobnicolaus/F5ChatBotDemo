'use strict';
//require('dotenv-extended').load();
const restify = require('restify');
const builder = require('botbuilder');

// Create chat connector for communicating with the Bot Framework Service
const connector = new builder.ChatConnector({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOF_APP_PASSWORD
});

// Setup Restify Server
const server = restify.createServer();
// Listen for messages from users
server.post('/api/messages', connector.listen());
server.listen(process.env.port || process.env.PORT || 3978, function() {
  console.log('%s listening to %s', server.name, server.url);
});

// Receive messages from the users and respond by echoing each message back (prefixed with 'You said: ')
const bot = module.exports = new builder.UniversalBot(connector, [
  (session, args, next) => {
    session.send(`Hi there! I'm a sample bot showing how multiple dialogs work.`);
    session.send(`Let's start the first dialog, which will ask you your name.`);
    session.beginDialog('getName');
  },

  (session, results, next) => {
    if (results.response) {
      const name = session.privateConversationData.name = results.response;
      session.beginDialog('adaptive_card_demo', {name: name});
    } else {
      session.endConversation(`Sorry, I didn't understand the response. Let's start over.`)
    }
  },

]);

bot.dialog('getName', [
  (session, args, next) => {
    if (args) {
      session.dialogData.isReprompt = args.isReprompt;
    }
    builder.Prompts.text(session, 'What is your name?');
  },

  (session, results, next) => {
    const name = results.response;
    if (!name || name.trim().length < 3) {
      if (session.dialogData.isReprompt) {
        session.endDialogWithResult({response: ''});
      } else {
        session.send('Sorry, name must be at least 3 characters.');
        session.replaceDialog('getName', {isReprompt: true});
      }
    } else {
      session.endDialogWithResult({response: name.trim()});
    }
  },

]);

bot.dialog('adaptive_card_demo',
  (session, args, next) => {

    if (session.message && session.message.value) {

      switch(session.message.value.type) {
        case "buyLicense":
          //session.send("Buy license");
          session.endDialogWithResult({response: "Buy license"});
          break;
        case "getTrial":
          session.send("Sure! We understand that you want to evaluate our product before making a decision.");
          session.send("Could you please let us know your email address so that we can send the license directly?");
          session.endDialogWithResult({response: "Get trial"});
          break;
        default:
          session.send("None");
      }

      return;
    }

    let name = session.dialogData.name = 'User';
    if (args) {
      session.dialogData.isReprompt = args.isReprompt;
      name = session.dialogData.name = args.name;
      session.send(`Hi, ${name}!`);
    }

    var adaptiveCardMessage = new builder.Message(session).addAttachment({
      "contentType": "application/vnd.microsoft.card.adaptive",
      "content": {
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "type": "AdaptiveCard",
        "version": "1.0",
        "body": [
          {
            "type": "Container",
            "speak": "<s>Are you looking to buy a license or to get a trial one?</s>",
            "items": [
              {
                "type": "ColumnSet",
                "columns": [
                  {
                    "type": "Column",
                    "size": "stretch",
                    "items": [
                      {
                        "type": "TextBlock",
                        "text": "Are you looking to buy a license or to get a trial one?",
                        "wrap": true
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ],
      "actions": [
        {
          "type": "Action.Submit",
          "title": "License",
          "data": {
            "type": "buyLicense"
          }
        },
        {
          "type": "Action.Submit",
          "title": "Trial",
          "data": {
            "type": "getTrial"
          }
        }
      ]
    }
  });

  session.send(adaptiveCardMessage);
});
