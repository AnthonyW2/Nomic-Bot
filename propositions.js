/**
  Anthony Wilson
  
  Nomic Bot command definitions module
**/



"use strict";

//Discord.js classes
const { Client, Message } = require("discord.js");

//Import various configurations/settings
const Config = require("./config.json");
const cmdpref = Config.prefix;
const sitePath = Config.sitePath;

//Import the secure/sensitive information (token, player user IDs, etc)
const SecureInfo = require("./secureinfo.json");

//Rule class
const { Rule } = require(sitePath+"/Rules/rule-class.js");

//Rule tree and player info list
const Rules = new Rule( require(sitePath+"/Rules/rules.json") );
const Players = require(sitePath+"/Players/players.json");



//Triggered when a player sends a message in #propositions
exports.createProposition = async (message) => {
  
  message.react(message.guild.emojis.cache.get(Config.emoji.upvote));
  message.react(message.guild.emojis.cache.get(Config.emoji.downvote));
  ///message.react("👍");
  ///message.react("👎");
  
  //logMessage("New proposition created");
  console.log("New proposition created");
  
}



//Triggered when a user reacts to a message in #propositions
exports.handleVote = async (reaction) => {
  
  console.log("User reacted to a message in #propositions");
  
}
