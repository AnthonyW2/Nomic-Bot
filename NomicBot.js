/**
 * Nomic Discord bot
 * 
 * @author Anthony Wilson
 * 
 * @version 3.0.0
 * 
 * @since 2021-8-7
 */

//Relevant links:
/// https://discord.js.org/#/docs/discord.js/v13/general/welcome
/// https://discordjs.guide/creating-your-bot/
/// https://discord.js.org/#/docs/discord.js/v13/class/Client
/// https://discordjs.guide/interactions/slash-commands.html#options



"use strict";

//Discord.js classes
const { Client, Intents } = require("discord.js");

//Fetch
const fetch = require("node-fetch");

//Timers
const timers = require("timers");

//Various configurations/settings
global.Config = require("./config.json");
global.cmdpref = Config.prefix;
global.sitePath = Config.sitePath;
//Some minor things will function differently if Nomic Bot is running in development mode
global.devmode = Config.devmode;

//Secure/sensitive information (token, player user IDs, etc)
global.SecureInfo = require("./secureinfo.json");

//Rule class
global.Rule = require(sitePath+"/Rules/rule-class.js").Rule;

//Rule tree and player info list
global.Rules = new Rule( require(sitePath+"/Rules/rules.json") );
global.Players = require(sitePath+"/Players/players.json");

//Import miscellaneous utility functions
const Utils = require("./utils.js");
global.logMessage = Utils.logMessage;
global.identifyPlayer = Utils.identifyPlayer;

//Command functions and commands list
const Commands = require("./commands.js");

//Functions specific to propositions
const Propositions = require("./propositions.js");

//GitHub integration
const Git = require("./git.js");



//Create a new client instance
global.client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
  ],
  partials: ["MESSAGE", "CHANNEL", "REACTION"]
});



//Indicate when the application has successfully connected
client.on("ready", () => {
  
  console.log(`Connected to ${client.user.tag}`);
  
  
  //Set presence
  client.user.setPresence({
    status: "online",
    activities: [
      { type: "PLAYING", name: "Nomic" },
      ///{ type: "WATCHING", name: "your votes" },
      ///{ type: "LISTENING", name: "the void" },
    ]
  });
  
  //Set a different presence if the bot is running in development mode
  if(devmode){
    client.user.setPresence({
      status: "online",
      activities: [
        { type: "PLAYING", name: "Development" }
      ]
    });
  }
  
  ///console.log("Set status");
  
  
  //Update the message in #links that links to the website
  updateServerURLMsg();
  
  
  ///Still to do: Get disconnect notifications working
  //console.log(client.ws);
  //console.log(client.ws.shards.get(0));
  //console.log("Function:",client.ws.shards.get(0).heartbeatInterval._onTimeout.toString());
  
  
  logMessage("Nomic Bot has successfully started");
  
});



//Update the message in #links that links to the website
var updateServerURLMsg = async () => {
  
  var req = await fetch("http://ifconfig.me/ip");
  var ip = await req.text();
  
  var msg = "Nomic website links\nGithub: <https://anthonyw2.github.io/Nomic/>\nAnthony's server: http://"+ip+":8084/Nomic";
  
  var linksChannel = client.channels.cache.get(SecureInfo.channels[5].ID);
  
  //Only used once to send the initial message
  ///linksChannel.send(msg);
  
  //Get the message with the server URL in it
  var message = await linksChannel.messages.fetch("962154858981507122");
  
  //Check if the message needs to be updated
  if(message.content != msg){
    
    message.edit(msg);
    
    logMessage("Updated server URL message");
    
  }
  
  //Update the link message again (if necessary) in 5 minutes
  timers.setTimeout(() => {
    updateServerURLMsg();
  }, 1000*60*5);
  
}



//Called when a message is sent in a Guild or DM that Nomic Bot has access to
client.on('messageCreate', async (message) => {
  
  //Test if the message is in the #propositions channel
  if(message.channelId === SecureInfo.channels[1].ID){
    
    Propositions.createProposition(message);
    
  }
  
  //Execute the command contained in the message if applicable
  Commands.processMessage(message);
  
});


//Called when a slash command is used in a Guild or DM that Nomic Bot has access to
client.on("interactionCreate", async (interaction) => {
  
  Commands.processInteraction(interaction);
  
});


//Called when a user reacts to a message
client.on("messageReactionAdd", async (reaction, user) => {
  
  //If the reaction message is not cached, attempt to fetch it from Discord
  if(reaction.partial){
    try {
      await reaction.fetch();
    }catch(error) {
      console.error("Failed to fetch reaction message", error);
      return;
    }
  }
  
  if(reaction.message.channelId === SecureInfo.channels[1].ID){
    
    Propositions.handleVote(reaction);
    
  }
  
});


//Called when a user removes a reaction to a message
//Known issue: If the reaction isn't already cached, this event will not trigger
client.on("messageReactionRemove", async (reaction, user) => {
  
  //If the reaction message is not cached, attempt to fetch it from Discord
  if(reaction.partial){
    try {
      await reaction.fetch();
    }catch(error) {
      console.error("Failed to fetch reaction message", error);
      return;
    }
  }
  
  if(reaction.message.channelId === SecureInfo.channels[1].ID){
    
    Propositions.handleVote(reaction);
    
  }
  
});



// Connect to the Discord API and login into the Nomic Bot application
client.login(SecureInfo.token);





