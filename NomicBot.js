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

//Various configurations/settings
const Config = require("./config.json");
const sitePath = Config.sitePath;
//Some minor things will function differently if Nomic Bot is running in development mode
const devmode = Config.devmode;

//Secure/sensitive information (token, player user IDs, etc)
const SecureInfo = require("./secureinfo.json");

//Import miscellaneous utility functions
const { logMessage, identifyPlayer } = require("./utils.js");

//Rule class
const { Rule } = require(sitePath+"/Rules/rule-class.js");

//Rule tree and player info list
const Rules = new Rule( require(sitePath+"/Rules/rules.json") );
const Players = require(sitePath+"/Players/players.json");

//Command functions and commands list
const Commands = require("./commands.js");

//Functions specific to propositions
const Propositions = require("./propositions.js");



//Create a new client instance
const client = new Client({
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
  
  
  ///Playing around with disconnect notifications
  //console.log(client.ws);
  //console.log(client.ws.shards.get(0));
  //console.log("Function:",client.ws.shards.get(0).heartbeatInterval._onTimeout.toString());
  
  
  logMessage(client, "Nomic Bot has successfully started");
  
});



//Update the message in #links that links to the website
var updateServerURLMsg = async () => {
  
  var req = await fetch("http://ifconfig.me/ip");
  var ip = await req.text();
  
  var msg = "Nomic website links\nGithub: https://anthonyw2.github.io/Nomic/\nAnthony's server: http://"+ip+":8084/Nomic";
  
  var linksChannel = client.channels.cache.get(SecureInfo.channels[5].ID);
  
  //Only used once to send the initial message
  ///linksChannel.send(msg);
  
  //Get the message with the server URL in it
  var message = await linksChannel.messages.fetch("962154858981507122");
  
  //Check if the message needs to be updated
  if(message.content != msg){
    
    message.edit(msg);
    
    logMessage(client, "Updated server URL message");
    
  }
  
}



//Called when a message is sent in a Guild or DM that Nomic Bot has access to
client.on('messageCreate', async (message) => {
  
  //Test if the message is in the #propositions channel
  if(message.channelId === SecureInfo.channels[1].ID){
  //if(message.channelId === SecureInfo.channels[4].ID){
    
    //console.log(message);
    
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
  
  //console.log("Reaction added:",reaction);
  
  //console.log(reaction.message.channelId);
  //console.log(SecureInfo.channels[1].ID);
  
  if(reaction.message.channelId === SecureInfo.channels[1].ID){
  //if(reaction.message.channelId === SecureInfo.channels[4].ID){
    
    //console.log(reaction);
    
    Propositions.handleVote(reaction);
    
  }
  
});


//Called when a user removes a reaction to a message
client.on("messageReactionRemove", async (reaction, user) => {
  
  //console.log("Reaction removed:",reaction);
  
});



// Connect to the Discord API and login into the Nomic Bot application
client.login(SecureInfo.token);





