/**
 * Nomic Discord bot
 * 
 * @author Anthony Wilson
 * 
 * @version 3.3.3
 * 
 * @since 2021-8-7
 */



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
global.RawRules = new Rule( require(sitePath+"/Rules/rules.json") );
global.Rules = new Rule( require(sitePath+"/Rules/rules.json") );
global.Players = require(sitePath+"/Players/players.json");

//Proposition list
global.Propositions = require(sitePath+"/Propositions/propositions.json");

//Import miscellaneous utility functions
const Utils = require("./utils.js");
global.rand = Utils.rand;
global.logMessage = Utils.logMessage;
global.identifyPlayer = Utils.identifyPlayer;
global.updateFile = Utils.updateFile;
global.getAttrList = Utils.getAttrList;

//Command functions and commands list
const Commands = require("./commands.js");

//Functions specific to propositions
global.PropositionFunctions = require("./propositions.js");
global.PropositionParsing = require(sitePath+"/Propositions/parse.js");



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



/**
 * @listens ready
 * Triggered when the application has successfully connected.
 */
client.on("ready", () => {
  
  console.log(`Connected to ${client.user.tag}`);
  
  
  //Set the status of the bot
  setPresence();
  
  
  //Update the message in #links that links to the website
  updateServerURLMsg();
  
  
  ///Still to do: Get disconnect notifications working
  //console.log(client.ws);
  //console.log(client.ws.shards.get(0));
  //console.log("Function:",client.ws.shards.get(0).heartbeatInterval._onTimeout.toString());
  
  
  logMessage("Nomic Bot has successfully started");
  
});



/**
 * @async
 * Update the message in #links that links to the website.
 * Initially called by @event ready then runs again every 5 minutes.
 */
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
  
  //Reset the presence of the bot while we're here
  setPresence();
  
  //Update the link message again (if necessary) in 5 minutes
  timers.setTimeout(() => {
    updateServerURLMsg();
  }, 1000*60*5);
  
}


/**
 * @async
 * Update the status of the bot
 * Initially called by @event ready and called again every 5 minutes.
 */
var setPresence = async () => {
  
  //Set a different presence if the bot is running in development mode
  if(devmode){
    client.user.setPresence({
      status: "online",
      activities: [
        { type: "PLAYING", name: "Development" }
      ]
    });
    return;
  }
  
  //Set default presence
  client.user.setPresence({
    status: "online",
    activities: [
      { type: "PLAYING", name: "Nomic" },
      ///{ type: "WATCHING", name: "your votes" },
      ///{ type: "LISTENING", name: "the void" },
    ]
  });
  
}



/**
 * @async
 * @listens messageCreate
 * Triggered when a message is sent in a Guild or DM that Nomic Bot has access to.
 * @param {Message} message
 */
client.on('messageCreate', async (message) => {
  
  //Test if the message is in the #propositions channel
  if(message.channelId === SecureInfo.channels[1].ID){
    
    PropositionFunctions.createProposition(message);
    
  }
  
  //Execute the command contained in the message if applicable
  Commands.processMessage(message);
  
});


/**
 * @async
 * @listens interactionCreate
 * Triggered when a slash command is used in a Guild or DM that Nomic Bot has access to.
 * @param {CommandInteraction} interaction
 */
client.on("interactionCreate", async (interaction) => {
  
  Commands.processInteraction(interaction);
  
});



/**
 * @async
 * @listens messageReactionAdd
 * Triggered when a user reacts to a message.
 * @param {MessageReaction} reaction
 * @param {User} user
 */
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
    
    PropositionFunctions.handleVote(reaction);
    
  }
  
});


/**
 * @async
 * @listens messageReactionRemove
 * Triggered when a user removes a reaction to a message.
 * @issue Known issue: If the reaction isn't already cached, this event will not trigger.
 * @param {MessageReaction} reaction
 * @param {User} user
 */
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
    
    PropositionFunctions.handleVote(reaction);
    
  }
  
});



// Connect to the Discord API and log into the Nomic Bot application
client.login(SecureInfo.token);
