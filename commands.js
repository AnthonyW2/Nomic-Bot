/**
 * Command definitions module
 * 
 * @author Anthony Wilson
 */



"use strict";

//Discord.js classes
const { MessageEmbed } = require("discord.js");

//Git functionality
const Git = require("./git.js");



/**
 * @async
 * Extracts the command arguments and calls the command.
 * Called by @event interactionCreate
 * @param {CommandInteraction} interaction
 */
exports.processInteraction = async (interaction) => {
  
  if(!interaction.isCommand()) {
    return;
  }
  
  
  ///console.log("interaction:",interaction);
  console.log("Slash command:",interaction.commandName);
  
  
  //Store the command as an array of arguments (args[0] is the name of the command)
  var args = [interaction.commandName];
  
  ///Add the raw option values to the args array (this is a "temporary" solution)
  var options = interaction.options._hoistedOptions;
  for(var o = 0;o < options.length;o ++){
    args.push(options[o].value);
  }
  
  
  //Iterate through commands to find the matching command
  for(var c = 0;c < exports.list.length;c ++){
    
    //Check for matching command
    if(args[0] === exports.list[c].name){
      
      //Execute the function corresponding to the matching command
      exports.list[c].func(interaction, args, "interaction");
      
      return;
      
    }
    
  }
  
}


/**
 * @async
 * Extracts the command arguments and calls the command.
 * Called by @event messageCreate
 * @param {Message} message
 */
exports.processMessage = async (message) => {
  
  if(message.content.substr(0,cmdpref.length) !== cmdpref){
    return;
  }
  
  
  ///console.log("message:",message);
  console.log("Text command:",message.content);
  
  
  //Split the message into arguments (args[0] is the name of the command)
  var args = message.content.substring(cmdpref.length).split(" ");
  
  //Iterate through commands to find the matching command
  for(var c = 0;c < exports.list.length;c ++){
    
    //Check for matching command
    if(args[0] === exports.list[c].name){
      
      //Execute the function corresponding to the matching command
      exports.list[c].func(message, args, "message");
      
      return;
      
    }
    
  }
  
  ///if(args[0] === "restart"){
  ///  
  ///  ///Authenticate by testing for specific user ID
  ///  
  ///  ///Kill the Nomic Bot process
  ///  ///Systemd will automatically restart the bot
  ///  
  ///}
  ///
  ///if(args[0] === "reboot"){
  ///  
  ///  ///Authenticate by testing for specific user ID
  ///  
  ///  ///Reboot the server that Nomic Bot is running on
  ///  
  ///}
  
}



/**
 * @async
 * Send a response message to a command.
 * Defaults to replying to slash commands, and sending a message in the same channel for text commands.
 * @param event
 * @param {string} eventtype "message" or "interaction"
 * @param {string} response Message data to send in response to the command
 * @param {boolean} replyoverride If set to true, always reply. If set to false, do not reply.
 */
exports.respond = async (event, eventtype, response, replyoverride) => {
  
  //Truncate the response message if it is over 2000 characters in length
  if(typeof(response) == "string"){
    if(response.length > 2000){
      response = response.substr(0,2000);
    }
  }
  
  //If replyoverride is not supplied, use the default type of response
  if(replyoverride == undefined){
    
    if(eventtype == "message"){
      return await event.channel.send(response);
    }else{
      return await event.reply(response);
    }
    
  }else if(replyoverride){
    
    //If replyoverride is true, reply to the command
    return await event.reply(response);
    
  }else{
    
    //If replyoverride is false, send a message in the same channel as the command
    return await event.channel.send(response);
    
  }
  
}



/**
 * @async
 * @command Get the response latency of Nomic Bot.
 * @param {} event The event (message or interaction) that called this command
 * @param {[string]} args Array of arguments to the command
 * @param {string} eventtype "message" or "interaction"
 */
exports.ping = async (event, args, eventtype) => {
  
  //Time between the user sending the message and the bot getting the message
  var initialLatency = Date.now() - event.createdTimestamp;
  
  //The websocket ping of this client object
  var APILatency = Math.round(client.ws.ping);
  
  //Send an initial message with only two values
  var initialMsg = await exports.respond(event, eventtype, "Total Latency: -\nUser to Bot Latency: "+initialLatency+"ms\nAPI Latency: "+APILatency+"ms");
  
  //Handle an interaction differently
  if(eventtype == "interaction"){
    
    //Get the initial reply from the interaction object
    var initialReply = await event.fetchReply();
    
    //Total time between the user sending the message and the bot's message reaching the Discord API
    var pingLatency = initialReply.createdTimestamp - event.createdTimestamp;
    
    //Edit the initial reply to add the new value
    await event.editReply("Total Latency: "+pingLatency+"ms\nUser to Bot Latency: "+initialLatency+"ms\nAPI Latency: "+APILatency+"ms").catch(console.error);
    
    return;
    
  }
  
  //Total time between the user sending the message and the bot's message reaching the Discord API
  var pingLatency = initialMsg.createdTimestamp - event.createdTimestamp;
  
  //Edit the initial message to add in the new value
  await initialMsg.edit("Total Latency: "+pingLatency+"ms\nUser to Bot Latency: "+initialLatency+"ms\nAPI Latency: "+APILatency+"ms").catch(console.error);
  
}



/**
 * @async
 * @command Send a list of commands.
 * @param {} event The event (message or interaction) that called this command
 * @param {[string]} args Array of arguments to the command
 * @param {string} eventtype "message" or "interaction"
 */
exports.help = async (event, args, eventtype) => {
  
  var helpMessage = new MessageEmbed();
  
  helpMessage.setTitle("Nomic Bot Help");
  helpMessage.setDescription("The current command prefix is " + cmdpref);
  helpMessage.addFields(
    { name: "Player Information", value: "For the current turn order and player stats, use the `"+cmdpref+"players` command."},
    { name: "Votes", value: "To get the votes on a rule, use the `"+cmdpref+"votes <message ID>` command.\nNomic Bot will automatically announce when a proposition reaches majority."},
    { name: "Random Numbers", value: "To generate a random number between `X` and `Y`, use the `"+cmdpref+"rand X Y` command.\nTo roll `X` virtual dice of size `Y`, use the `"+cmdpref+"roll XdY` command."},
    { name: "Dice Rolling", value: "To roll `N` dice of size `X`, use the `"+cmdpref+"roll NdX` command."},
    ///{ name: "Random Card", value: "To get a random card, use the `"+cmdpref+"card` command."},
  );
  helpMessage.setFooter({
    text: "Ask Anthony for more details"
  });
  
  await exports.respond(event, eventtype, {embeds: [helpMessage]});
  
}



/**
 * @async
 * @command Send a list of players.
 * @param {} event The event (message or interaction) that called this command
 * @param {[string]} args Array of arguments to the command
 * @param {string} eventtype "message" or "interaction"
 */
exports.players = async (event, args, eventtype) => {
  
  var playerList = "";
  
  //Print players in order of PID
  for(var p = 0;p < Players.length;p ++){
    
    if(Players[p].playing){
      
      playerList += "\n" + (p+1) + " - " + Players[p].name + " (<@" + SecureInfo.players[p].ID + ">)";
      
      if(!Players[p].active){
        playerList += " (:zzz:)";
      }
      
    }
    
  }
  
  //Print players in turn order (no longer applicable)
  //for(var t = 0;t < Players.length;t ++){
  //  
  //  for(var p = 0;p < Players.length;p ++){
  //    if(Players[p].turn == t && Players[p].playing){
  //      
  //      playerList += "\n" + (t+1) + " - " + Players[p].name + " (<@" + SecureInfo.players[p].ID + ">)";
  //      
  //      if(!Players[p].active){
  //        playerList += " (:zzz:)";
  //      }
  //      
  //    }
  //  }
  //  
  //}
  
  var reply = new MessageEmbed();
  reply.addField("Players:", playerList);
  
  await exports.respond(event, eventtype, {embeds: [reply]});
  
}



/**
 * @async
 * @command Return a summary of the current voting status.
 * @param {} event The event (message or interaction) that called this command
 * @param {[string]} args Array of arguments to the command
 * * @argument message The ID of the proposition message
 * @param {string} eventtype "message" or "interaction"
 */
exports.votes = async (event, args, eventtype) => {
  
  ///To do:
  ///Get a list of ongoing propositions if no ID is given
  
  var propositionsChannel = client.channels.cache.get(SecureInfo.channels[1].ID);
  
  //Get the message with the given ID
  var propositionMsg;
  await propositionsChannel.messages.fetch(args[1]).then((msg) => {
    propositionMsg = msg;
  }).catch((err) => {
    console.log("Error finding proposition");
  });
  
  //Report an error if the message was not found
  if(typeof(propositionMsg) != "object"){
    exports.respond(event, eventtype, "Error: Unable to identify proposition. The message ID may be incorrect.");
    return;
  }
  
  //The the ID of the matching stored proposition
  var propositionID = PropositionFunctions.matchProposition(propositionMsg);
  
  //Report an error if a matching stored proposition was not found
  if(propositionID == -1){
    exports.respond(event, eventtype, "Error: Unable to match a stored proposition.");
    logMessage("ERROR: Matching proposition not found");
    return;
  }
  
  
  //Get the vote status using functionality from propositions.js
  var voteStatus = await PropositionFunctions.getVoteStatus(propositionMsg, propositionID);
  
  //Create a list of names of players who voted each way
  var upvoteList = getAttrList(voteStatus.upvotes,"name");
  var downvoteList = getAttrList(voteStatus.downvotes,"name");
  var leftvoteList = getAttrList(voteStatus.leftvotes,"name");
  var rightvoteList = getAttrList(voteStatus.rightvotes,"name");
  
  //Create the reply as an embed
  var reply = new MessageEmbed();
  
  reply.setDescription("Votes on <@"+propositionMsg.author.id+">'s " + (Propositions[propositionID].judgesuggestion ? "suggestion" : "proposition"));
  
  //Add a field describing the type of majority (if applicable)
  switch(voteStatus.majority){
    case -1:
      reply.addField("Not yet majority",voteStatus.remaining.length+" votes remaining");
      break;
    case 0:
      reply.addField("Tie","The proposition has not passed");
      break;
    case 1:
      reply.addField("Upvote majority","The proposition has passed");
      break;
    case 2:
      reply.addField("Downvote majority","The proposition has not passed");
      break;
    case 3:
      reply.addField("Leftvote majority","The proposition must be re-proposed");
  }
  
  if(args.length > 2){
    if(args[2] == "remaining" || args[2] == "r"){
      var remainingList = getAttrList(voteStatus.remaining,"name");
      reply.addField("Remaining:", remainingList.length > 0 ? remainingList.join("\n") : "NA");
    }
  }
  
  reply.addField("Upvotes: "+upvoteList.length, upvoteList.length > 0 ? upvoteList.join("\n") : "NA");
  reply.addField("Downvotes: "+downvoteList.length, downvoteList.length > 0 ? downvoteList.join("\n") : "NA");
  if(!Propositions[propositionID].judgesuggestion){
    reply.addField("Leftvotes: "+leftvoteList.length, leftvoteList.length > 0 ? leftvoteList.join("\n") : "NA");
    reply.addField("Rightvotes: "+rightvoteList.length, rightvoteList.length > 0 ? rightvoteList.join("\n") : "NA");
  }
  
  if(voteStatus.illegalVote){
    reply.addField("Warning","Illegal vote(s) detected");
  }
  
  exports.respond(event, eventtype, {embeds: [reply]});
  
  
  //Update the stored proposition data
  PropositionFunctions.updateProposition(propositionMsg, voteStatus);
  
}



/**
 * @async
 * @command Generate a random number, or a set of random numbers.
 * @param {} event The event (message or interaction) that called this command
 * @param {[string]} args Array of arguments to the command
 * @param {string} eventtype "message" or "interaction"
 */
exports.rand = async (event, args, eventtype) => {
  
  var lowerbound = 0;
  var upperbound = 1;
  
  if(args.length == 1){
    //If no arguments are given, return a random number in the interval [0,1)
    
    await exports.respond(event, eventtype, "Number between 0 and 1:\n"+Math.random().toString());
    return;
    
  }else if(args.length == 2){
    //Return a random integer between 0 and the only argument, inclusive
    
    //Exit with an error message if the given argument is not a number
    if(isNaN(args[1])){
      await exports.respond(event, eventtype, "ERROR: Supplied argument `"+args[1]+"` is not a number");
      return;
    }
    
    upperbound = parseInt(args[1].replace(".",""), 10);
    
  }else if(args.length == 3){
    //Return a random integer between the two arguments, inclusive
    
    //Exit with an error message if any of the arguments are not a number
    for(var a = 1;a < args.length;a ++){
      if(isNaN(args[a])){
        await exports.respond(event, eventtype, "ERROR: Supplied argument `"+args[a]+"` is not a number");
        return;
      }
    }
    
    lowerbound = parseInt(args[1].replace(".",""), 10);
    upperbound = parseInt(args[2].replace(".",""), 10);
    
  }else{
    //Exit with an error if too many arguments are given
    
    await exports.respond(event, eventtype, "ERROR: Too many arguments given. Please refer to the documentation on how to use this command:\n<"+Config.siteURL+"/docs.html#nomic-bot-commands-rand>");
    return;
    
  }
  
  var randint = Math.floor(Math.random() * (upperbound-lowerbound+1)) + lowerbound;
  
  await exports.respond(event, eventtype, "Random integer between "+lowerbound+" and "+upperbound+":\n"+randint);
  
}



/**
 * @async
 * @command Generate a random number in a more user-friendly way by rolling virtual dice.
 * @param {} event The event (message or interaction) that called this command
 * @param {[string]} args Array of arguments to the command
 * @param {string} eventtype "message" or "interaction"
 */
exports.roll = async (event, args, eventtype) => {
  
  var size = 6;
  var amount = 1;
  
  //If only a single parameter is given
  if(args.length == 2){
    
    var arg = args[1].toLowerCase().replaceAll(".","");
    
    if(arg.includes("d")){
      
      var params = arg.split("d");
      
      if(params[0] != ""){
        amount = parseInt(params[0], 10);
      }
      if(params[1] != ""){
        size = parseInt(params[1], 10);
      }
      
    }else{
      
      size = parseInt(arg, 10);
      
    }
    
  }else{
    
    //Iterate through the given arguments
    for(var a = 1;a <= 2 && a < args.length;a ++){
      
      var arg = args[a].toLowerCase().replaceAll(".","");
      
      if(arg.includes("d")){
        
        //If the argument contains "d", then this must be the size of the dice
        
        var num = arg.replace("d","");
        
        if(isNaN(num)){
          await exports.respond(event, eventtype, "ERROR: Supplied argument `"+num+"` is not a valid numeric input");
          return;
        }
        
        size = parseInt(num, 10);
        
      }else if(args[a].includes("x")){
        
        //If the argument contains "x", then this must be the amount of dice to roll
        
        var num = arg.replace("x","");
        
        if(isNaN(num)){
          await exports.respond(event, eventtype, "ERROR: Supplied argument `"+num+"` is not a valid numeric input");
          return;
        }
        
        amount = parseInt(num, 10);
        
      }else{
        
        //If the argument does not contain "d" or "x", then treat the first arg as the amount and the second as the die size
        
        if(isNaN(arg)){
          await exports.respond(event, eventtype, "ERROR: Supplied argument `"+args[a]+"` is not a valid numeric input");
          return;
        }
        
        if(a === 1){
          amount = parseInt(arg, 10);
        }else if(a === 2){
          size = parseInt(arg, 10);
        }
        
      }
      
    }
    
  }
  
  
  //Restrict the size of dice to 10000
  size = Math.min(size, 10000);
  //Restrict the amount of rolls to 200
  amount = Math.min(amount, 200);
  
  
  //Generate a set of random dice rolls to return
  var rolls = [];
  for(var r = 0;r < amount;r ++){
    rolls.push( Math.floor(Math.random() * size) + 1 );
  }
  
  //Send a message with the list of dice rolls
  await exports.respond(event, eventtype, "Rolling "+amount+" D"+size+":\n" + rolls.join(", "));
  
}



/**
 * @async
 * @command Randomise a list of numbers or strings.
 * @param {} event The event (message or interaction) that called this command
 * @param {[string]} args Array of arguments to the command
 * @param {string} eventtype "message" or "interaction"
 */
exports.listrand = async (event, args, eventtype) => {
  
  var list = [];
  
  //Return an error message if no arguments are given
  if(args.length < 2){
    
    await exports.respond(event, eventtype, "ERROR: Please ensure that you supply a valid argument to this command. For more information:\n<"+Config.siteURL+"/docs.html#nomic-bot-commands-listrand>");
    return;
    
  }
  
  //Combine all the arguments together into a single string
  var arg = "";
  for(var a = 1;a < args.length;a ++){
    
    arg += args[a];
    
    if(a != args.length-1){
      arg += ",";
    }
    
  }
  
  if(args.length > 2 || arg.includes(" ") || arg.includes(",")){
    
    var str = arg.replaceAll(", ",",").replaceAll(" ,",",").replaceAll(" ",",").replaceAll(",,",",");
    
    list = str.split(",");
    
  }else if(!isNaN(arg)){
    
    var size = parseInt(arg, 10);
    
    for(var n = 0;n < size;n ++){
      
      list.push(n);
      
    }
    
  }else{
    
    await exports.respond(event, eventtype, "ERROR: Please ensure that you supply a valid argument to this command. For more information:\n<"+Config.siteURL+"/docs.html#nomic-bot-commands-listrand>");
    return;
    
  }
  
  var listlen = list.length;
  
  //Return an error if the amount of elements is too small
  if(listlen < 2){
    await exports.respond(event, eventtype, "ERROR: Please ensure that you supply enough items to randomise. For more information:\n<"+Config.siteURL+"/docs.html#nomic-bot-commands-listrand>");
    return;
  }
  
  var output = [];
  
  //Iterate through the items in the list
  for(var i = 0;i < listlen;i ++){
    
    //Add a random item from the original array to the output array
    var j = Math.floor(Math.random()*list.length);
    output.push(list[j]);
    
    //Remove the chosen data from the copy of the original array
    list.splice(j,1);
    
  }
  
  await exports.respond(event, eventtype, output.join(", "));
  
}



/**
 * @async
 * @command Return a random player.
 * @param {} event The event (message or interaction) that called this command
 * @param {[string]} args Array of arguments to the command
 * @param {string} eventtype "message" or "interaction"
 */
exports.randplayer = async (event, args, eventtype) => {
  
  var p = Math.floor(Math.random()*Players.length);
  
  var player = Players[p];
  
  await exports.respond(event, eventtype, player.name);
  
}



/**
 * @async
 * @command Return the player list in a random order.
 * @param {} event The event (message or interaction) that called this command
 * @param {[string]} args Array of arguments to the command
 * @param {string} eventtype "message" or "interaction"
 */
exports.randplayerlist = async (event, args, eventtype) => {
  
  var output = [];
  
  var list = [];
  
  //Add all player names to the list
  for(var p = 0;p < Players.length;p ++){
    list.push(Players[p].name);
  }
  
  //Iterate through the items in the list
  for(var i = 0;i < Players.length;i ++){
    
    //Add a random item from the original array to the output array
    var j = Math.floor(Math.random()*list.length);
    output.push(list[j]);
    
    //Remove the chosen data from the copy of the original array
    list.splice(j,1);
    
  }
  
  await exports.respond(event, eventtype, output.join("\n"));
  
}



/**
 * @async
 * @command Manually add a new proposition to storage.
 * @param {} event The event (message or interaction) that called this command
 * @param {[string]} args Array of arguments to the command
 * * @argument message The ID of the proposition message
 * @param {string} eventtype "message" or "interaction"
 */
exports.addprop = async (event, args, eventtype) => {
  
  var propositionsChannel = client.channels.cache.get(SecureInfo.channels[1].ID);
  
  //Get the message with the given ID
  var propositionMsg;
  await propositionsChannel.messages.fetch(args[1]).then((msg) => {
    propositionMsg = msg;
  }).catch((err) => {
    console.log("Error finding proposition");
  });
  
  //Report an error if the message was not found
  if(typeof(propositionMsg) != "object"){
    exports.respond(event, eventtype, "Error: Unable to identify proposition. The message ID may be incorrect.");
    return;
  }
  
  //The the ID of the matching stored proposition
  var propositionID = PropositionFunctions.matchProposition(propositionMsg);
  
  //Report an error if a matching stored proposition was found
  if(propositionID != -1){
    exports.respond(event, eventtype, "Error: Proposition already exists.");
    return;
  }
  
  PropositionFunctions.createProposition(propositionMsg);
  
}



/**
 * @async
 * @command Move a player in the World.
 * @param {} event The event (message or interaction) that called this command
 * @param {[string]} args Array of arguments to the command
 * * @argument direction The direction to move.
 * @param {string} eventtype "message" or "interaction"
 */
exports.move = async (event, args, eventtype) => {
  
  await exports.respond(event, eventtype, "Awaiting implementation");
  
}



/**
 * @async
 * @command Randomly generate the stats for a mouse.
 * @param {} event The event (message or interaction) that called this command
 * @param {[string]} args Array of arguments to the command
 * @param {string} eventtype "message" or "interaction"
 */
exports.newmouse = async (event, args, eventtype) => {
  
  var stats = "Energy: 1";
  stats += "\nMischief: " + Math.floor(Math.random() * 2 + 1).toString();
  stats += "\nWits: " + Math.floor(Math.random() * 2 + 1).toString();
  stats += "\nPower: " + (Math.floor(Math.random() * 3) + Math.floor(Math.random() * 3) + 2).toString();
  stats += "\nCuriosity: " + Math.floor(Math.random() * 4 + 1).toString();
  
  var reply = new MessageEmbed();
  reply.addField("Statistics:", stats);
  
  await exports.respond(event, eventtype, {embeds: [reply]});
  
}



/**
 * @async
 * @command Return the player list in a random order.
 * @param {} event The event (message or interaction) that called this command
 * @param {[string]} args Array of arguments to the command
 * @param {string} eventtype "message" or "interaction"
 */
exports.git = async (event, args, eventtype) => {
  
  //Only allow the system maintainer to use git commands (for now)
  if(event.author.id != SecureInfo.players[0].ID){
    exports.respond(event, eventtype, "You are not authorised to perform this action");
    return;
  }
  
  switch(args[1]){
    case "status":
      
      Git.status((output) => {
        exports.respond(event, eventtype, "```"+output.stdout+"```");
      });
      
      break;
    case "pull":
      console.log("Awaiting implementation");
      break;
    case "push":
      
      var commitMsg = "Synced changes";
      if(args.length > 2){
        commitMsg = args.slice(2).join(" ");
      }
      
      Git.push(commitMsg, (output) => {
        exports.respond(event, eventtype, "```"+output.stdout+"```");
        console.log(output.stderr);
      });
      
      break;
    case "sync":
      console.log("Awaiting implementation");
      break;
  }
  
}



/**
 * @async
 * @command Get information about a Discord message.
 * @param {} event The event (message or interaction) that called this command
 * @param {[string]} args Array of arguments to the command
 * * @argument message The ID of the Discord message to get information about
 * * @argument channel The Discord ID or NAS internal ID of the Discord channel which the message is within
 * @param {string} eventtype "message" or "interaction"
 */
exports.msginfo = async (event, args, eventtype) => {
  
  if(args.length < 3){
    await exports.respond(event, eventtype, "ERROR: Please ensure that you supply the message ID and channel ID. For more information:\n<"+Config.siteURL+"/docs.html#nomic-bot-commands-msginfo>");
    return;
  }
  
  //Get the channel
  var channel;
  if(args[2].length > 2){
    channel = client.channels.cache.get(args[2]);
  }else{
    var channelID = SecureInfo.channels[ parseInt(args[2],10) ]?.ID;
    if(channelID == undefined){
      await exports.respond(event, eventtype, "ERROR: Channel not found. Please ensure you supplied a valid channel ID.");
      return;
    }
    channel = client.channels.cache.get(channelID);
  }
  
  //Report an error if the channel was not found
  if(typeof(channel) != "object"){
    await exports.respond(event, eventtype, "ERROR: Channel not found. Please ensure you supplied a valid channel ID.");
    return;
  }
  
  //Get the message
  var message;
  await channel.messages.fetch(args[1]).then((msg) => {
    message = msg;
  }).catch((err) => {
    console.log("Error finding message");
  });
  
  //Report an error if the message was not found
  if(typeof(message) != "object"){
    await exports.respond(event, eventtype, "ERROR: Message not found. Please ensure you supplied the correct channel ID and a valid message ID.");
    return;
  }
  
  
  //Create the reply as an embed
  var reply = new MessageEmbed();
  
  reply.setDescription("Information about message with ID "+args[1]);
  
  var createdTSRounded = Math.round(message.createdTimestamp/1000).toString();
  var editedTSRounded = Math.round(message.editedTimestamp/1000).toString();
  var createdTS = (message.createdTimestamp/1000).toString();
  var editedTS = (message.editedTimestamp/1000).toString();
  
  reply.addField("Timestamp", createdTS + " (<t:"+createdTSRounded+">)");
  reply.addField("Author", "<@"+message.author.id+">");
  if(message.editedTimestamp != null){
    reply.addField("Edited Timestamp", editedTS + " (<t:"+editedTSRounded+">)");
  }
  reply.addField("URL", message.url);
  //reply.setURL(message.url); //I don't know what this does, but it doesn't appear to change anything for regular users
  
  await exports.respond(event, eventtype, {embeds: [reply]});
  
}



//List of commands
exports.list = [
  {
    name: "ping",
    description: "Get Nomic Bot reponse latency",
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
  },
  {
    name: "votes",
    description: "Return current voting status",
    func: exports.votes,
    options: [
      {
        name: "message",
        description: "ID of the proposition message"
      },
      {
        name: "options",
        description: "Control extra functionality"
      }
    ]
  },
  {
    name: "rand",
    description: "Generate random numbers",
    func: exports.rand
  },
  {
    name: "roll",
    description: "Roll virtual dice for random integers",
    func: exports.roll,
    options: [
      {
        name: "amount",
        description: "Amount of dice to roll"
      },
      {
        name: "size",
        description: "Size of the dice"
      }
    ]
  },
  {
    name: "listrand",
    description: "Randomise a list",
    func: exports.listrand,
    options: [
      {
        name: "items",
        description: "Amount of items or a list of items to randomise"
      }
    ]
  },
  {
    name: "randplayer",
    description: "Return a random player",
    func: exports.randplayer
  },
  {
    name: "randplayerlist",
    description: "Return the list of players in a random order",
    func: exports.randplayerlist
  },
  {
    name: "addprop",
    description: "Add a new proposition to storage",
    func: exports.addprop,
    options: [
      {
        name: "message",
        description: "ID of the proposition message"
      }
    ]
  },
  {
    name: "move",
    description: "Move a player in the World",
    func: exports.move,
    options: [
      {
        name: "direction",
        description: "The direction the player wishes to move"
      }
    ]
  },
  {
    name: "newmouse",
    description: "Randomly generate the stats for a new mouse",
    func: exports.newmouse
  },
  {
    name: "git",
    description: "Run a git command",
    func: exports.git,
    options: [
      {
        name: "command",
        description: "The git command to run [status/sync/push/pull]"
      },
      {
        name: "parameters",
        description: "Other (optional) parameters to supply to the specified git command."
      }
    ]
  },
  {
    name: "msginfo",
    description: "Get information about a message",
    func: exports.msginfo,
    options: [
      {
        name: "message",
        description: "ID of the target message"
      },
      {
        name: "channel",
        description: "Number or ID of the channel the message is in"
      }
    ]
  }
];
