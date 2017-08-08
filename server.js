'use strict';
//require('dotenv-extended').load();
const restify = require('restify');
const builder = require('botbuilder');

// Create chat connector for communicating with the Bot Framework Service
const connector = new builder.ChatConnector({
  appId: "53ff7a56-db6d-461f-bd36-9f681ee7f915",
  appPassword: "S6PqvYpm0i792RvqcBaOVNC"
});

// Setup Restify Server
const server = restify.createServer();

// Handle Bot Framework messages
server.post('/api/messages', connector.listen());

// Serve a static web page
server.get(/.*/, restify.serveStatic({
	'directory': '.',
	'default': 'index.html'
}));

server.listen(process.env.port || process.env.PORT || 3978, function() {
  console.log('%s listening to %s', server.name, server.url);
});

// Receive messages from the users and respond by echoing each message back (prefixed with 'You said: ')
const bot = module.exports = new builder.UniversalBot(connector, [
  (session, args, next) => {
    session.send('Hi there! I am F5ChatbotDemo.');
    session.beginDialog('getName');
  },

  (session, results, next) => {
    if (results.response) {
      const name = session.privateConversationData.name = results.response;
      session.beginDialog('getLicenseType', {name: name});
    } else {
      session.endConversation('I am sorry. I do not understand that. Could we start over?');
    }
  },

  (session, results, next) => {
    if (results.response) {
      const licenseType = session.privateConversationData.licenseType = results.response;
      session.beginDialog('getEmail', {licenseType: licenseType});
    } else {
      session.endConversation('I am sorry. I do not understand that. Could we start over?');
    }
  }

]);

bot.dialog('getName', [
  (session, args, next) => {
    if (args) {
      session.dialogData.isReprompt = args.isReprompt;
    }
    builder.Prompts.text(session, 'May I know your name please?');
  },

  (session, results, next) => {
    const name = results.response;
    if (!name || name.trim().length < 3) {
      if (session.dialogData.isReprompt) {
        session.endDialogWithResult({response: ''});
      } else {
        session.send('I am sorry, name must be at least 3 characters.');
        session.replaceDialog('getName', {isReprompt: true});
      }
    } else {
      session.endDialogWithResult({response: name.trim()});
    }
  },

]);

bot.dialog('getLicenseType',
  (session, args, next) => {

    if (session.message && session.message.value) {

      const licenseType = session.message.value.type;
      switch(licenseType) {
        case "buyLicense":
          session.send('Great! It seems that you already have something in mind.');
          session.endDialogWithResult({response: licenseType});
          break;
        case "getTrial":
          session.send('Sure! We understand that you want to evaluate our product before making a decision.');
          session.endDialogWithResult({response: licenseType});
          break;
        default:
          session.send('None');
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

bot.dialog('getEmail', [
  (session, args, next) => {
    let licenseType = session.dialogData.licenseType = 'None';
    if (args) {
      session.dialogData.isReprompt = args.isReprompt;
      licenseType = session.dialogData.licenseType = args.licenseType;
    }
    builder.Prompts.text(session, 'Could you please let us know your email address so that we can send the license directly?');
  },

  (session, results, next) => {
    const emailAddress = results.response;
    if (!emailAddress || emailAddress.trim().length < 7) {
      if (session.dialogData.isReprompt) {
        session.endDialogWithResult({response: ''});
      } else {
        session.send('I am sorry, you must provide a valid email address.');
        session.replaceDialog('getEmail', {isReprompt: true});
      }
    } else {
      session.send(`Got it! We will send the license to your email address: ${emailAddress}`);
      session.send(`Thank you.`);
      session.endDialogWithResult({response: emailAddress.trim()});
    }
  },

]);
