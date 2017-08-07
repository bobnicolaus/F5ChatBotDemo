var restify = require('restify');
var builder = require('botbuilder');

// Get secrets from server environment
var botConnectorOptions = { 
    appId: "53ff7a56-db6d-461f-bd36-9f681ee7f915", 
    appPassword: "S6PqvYpm0i792RvqcBaOVNC"
};

// Create bot
var connector = new builder.ChatConnector(botConnectorOptions);
var bot = new builder.UniversalBot(connector);

bot.dialog('/', function (session) {
    
    //respond with user's message
    session.send("You said " + session.message.text);
});

// Setup Restify Server
var server = restify.createServer();

// Handle Bot Framework messages
server.post('/api/messages', connector.listen());

// Serve a static web page
server.get(/.*/, restify.serveStatic({
	'directory': '.',
	'default': 'index.html'
}));

server.listen(process.env.port || 3978, function () {
    console.log('%s listening to %s', server.name, server.url); 
});
