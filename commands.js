/**
  Anthony Wilson
  
  Nomic Bot command definitions module
**/



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
      exports.list[c].func(interaction, args);
      
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
      exports.list[c].func(message, args);
      
      return;
      
    }
    
  }
  
}



exports.ping = async (event, args) => {
  
  await event.reply("Nomic Bot is online and responsive");
  
}


exports.help = async (event, args) => {
  
  await event.reply("[Nomic Bot help - placeholder]");
  
}


exports.players = async (event, args) => {
  
  var reply = "List of players:";
  
  for(var p = 0;p < SecureInfo.players.length;p ++){
    reply += "\n"+SecureInfo.players[p].name;
  }
  
  await event.reply(reply);
  
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

