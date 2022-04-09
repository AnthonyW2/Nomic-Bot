/**
  Anthony Wilson
  
  Nomic Bot command definitions module
**/



//Discord.js classes
const { Client, MessageEmbed } = require("discord.js");

//Import various configurations/settings
const Config = require("./config.json");
const cmdpref = Config.prefix;

//Import the secure/sensitive information (token, player user IDs, etc)
const SecureInfo = require("./secureinfo.json");



//Triggered when a slash command is used.
//Extracts the command arguments and calls the command.
exports.processInteraction = async (interaction) => {
  
  if(!interaction.isCommand()) {
    return;
  }
  
  
  ///console.log("interaction:",interaction);
  console.log("Slash command:",interaction.commandName);
  
  
  //Store the command as an array of arguments (args[0] is the name of the command)
  var args = [interaction.commandName];
  
  //Iterate through commands
  for(var c = 0;c < exports.list.length;c ++){
    
    //Check for matching command
    if(args[0] === exports.list[c].name){
      
      //Execute the function corresponding to the matching command
      exports.list[c].func(interaction, args, "interaction");
      
      return;
      
    }
    
  }
  
}


//Triggered when a message is sent.
//Extracts the command arguments and calls the command.
exports.processMessage = async (message) => {
  
  if(message.content.substr(0,cmdpref.length) !== cmdpref){
    return;
  }
  
  
  ///console.log("message:",message);
  console.log("Text command:",message.content);
  
  
  //Split the message into arguments (args[0] is the name of the command)
  var args = message.content.substring(cmdpref.length).split(" ");
  
  //Iterate through commands
  for(var c = 0;c < exports.list.length;c ++){
    
    //Check for matching command
    if(args[0] === exports.list[c].name){
      
      //Execute the function corresponding to the matching command
      exports.list[c].func(message, args, "message");
      
      return;
      
    }
    
  }
  
}



//Send a response message to a command
//Defaults to replying to slash commands, and sending a message in the same channel for text commands
exports.respond = async (event, eventtype, response, replyoverride) => {
  
  //If replyoverride is not supplied, use the default type of response
  if(replyoverride == undefined){
    
    if(eventtype == "message"){
      await event.channel.send(response);
    }else{
      await event.reply(response);
    }
    
  }else if(replyoverride){
    
    //If replyoverride is true, reply to the command
    await event.reply(response);
    
  }else{
    
    //If replyoverride is false, send a message in the same channel as the command
    await event.channel.send(response);
    
  }
  
}



//Check if Nomic Bot is online
exports.ping = async (event, args, eventtype) => {
  
  await exports.respond(event, eventtype, "Nomic Bot is online and responsive");
  
}


//Send a list of commands
exports.help = async (event, args, eventtype) => {
  
  var helpMessage = new MessageEmbed();
  
  helpMessage.setTitle("Nomic Bot Help");
  helpMessage.setDescription("The current command prefix is " + cmdpref);
  helpMessage.addFields(
    { name: "Player Information", value: "For the current turn order and player stats, use the `"+cmdpref+"players` command."},
    ///{ name: "Votes", value: "To get the votes on a rule, use the `"+cmdpref+"votes <message ID>` command.\nNomic Bot will automatically announce when a proposal reaches majority."},
    ///{ name: "Dice Rolling", value: "To roll a die of size `<n>`, use the `"+cmdpref+"roll <n>` command."},
    ///{ name: "Random Card", value: "To get a random card, use the `"+cmdpref+"card` command."},
  );
  helpMessage.setFooter({
    text: "Ask Anthony for more details"
  });
  
  await exports.respond(event, eventtype, {embeds: [helpMessage]});
  
}


//Send a list of players
exports.players = async (event, args, eventtype) => {
  
  var playerList = "";
  
  for(var p = 0;p < SecureInfo.players.length;p ++){
    
    playerList += "\n" + (p+1) + " - " + SecureInfo.players[p].name + " (<@" + SecureInfo.players[p].ID + ">)";
    
  }
  
  var reply = new MessageEmbed();
  reply.addField("Players:", playerList);
  
  await exports.respond(event, eventtype, {embeds: [reply]});
  
}



//List of commands
exports.list = [
  {
    name: "ping",
    description: "Test of Nomic Bot is online",
    func: exports.ping
  },
  {
    name: "help",
    description: "List commands",
    func: exports.help
  },
  {
    name: "players",
    description: "List players of Season 3",
    func: exports.players
  }
];

