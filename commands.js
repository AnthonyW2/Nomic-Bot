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

//Magic functionality
const Magic = require("./magic.js");



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
  //var args = [interaction.commandName];
  var args = {
    cmd: interaction.commandName,
    list: []
  };
  
  ///Add the raw option values to the args array (this is a "temporary" solution)
  var options = interaction.options._hoistedOptions;
  for(var o = 0;o < options.length;o ++){
    //args.push(options[o].value);
    args[options[o].name] = options[o].value;
    args.list.push(options[o].value);
  }
  
  //Iterate through commands to find the matching command
  for(var c = 0;c < exports.list.length;c ++){
    
    //Check for matching command
    if(args.cmd === exports.list[c].name){
      
      //Indicate that Nomic Bot is going to respond to the command
      interaction.channel.sendTyping();
      
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
  var arglist = message.content.substring(cmdpref.length).split(" ");
  var args = {
    cmd: arglist[0]
  };
  arglist.shift();
  args.list = arglist;
  
  //Iterate through commands to find the matching command
  for(var c = 0;c < exports.list.length;c ++){
    
    //Check for matching command
    if(args.cmd === exports.list[c].name){
      
      //Indicate that Nomic Bot is going to respond to the command
      message.channel.sendTyping();
      
      //Execute the function corresponding to the matching command
      exports.list[c].func(message, args, "message");
      
      return;
      
    }
    
  }
  
  if(args.cmd === "restart"){
    
    ///Authenticate by testing for specific user ID
    if(message.author.id == SecureInfo.players[0].ID){
      
      logMessage("Shutting down...");
      
      //Kill the Nomic Bot process
      //Systemd should automatically restart the bot
      process.exit();
      
    }
    
  }
  
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
      if(event.replied){
        //Append to previous response
        return await event.followUp(response);
      }else if(event.deferred){
        //Replace previous (deferred) response
        return await event.editReply(response);
      }else{
        return await event.reply(response);
      }
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
 * @param {Object} args Arguments to the command
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
 * @param {Object} args Arguments to the command
 * @param {string} eventtype "message" or "interaction"
 */
exports.help = async (event, args, eventtype) => {
  
  var helpMessage = new MessageEmbed();
  
  helpMessage.setTitle("Nomic Bot Help");
  helpMessage.setDescription("The current command prefix is " + cmdpref + ", but slash (/) commands are recommended.");
  helpMessage.addFields(
    { name: "Player Information", value: "For the current player stats, use the `"+cmdpref+"players` command."},
    { name: "Votes", value: "To get the votes on all active propositions, use the `/votes` command.\nTo get the votes on a specific proposition, use the `"+cmdpref+"votes <message ID>` command.\nNomic Bot will automatically announce when a proposition reaches majority."},
    { name: "Random Numbers", value: "To generate a random integer between `X` and `Y`, use the `"+cmdpref+"rand X Y` command.\nTo generate a random number between 0 and 1, use the `"+cmdpref+"rand` command."},
    { name: "Dice Rolling", value: "To roll `N` dice of size `X`, use the `"+cmdpref+"roll NdX` command."}
  );
  helpMessage.setThumbnail(client.user.displayAvatarURL());
  helpMessage.setFooter({
    text: "See the website for more details"
  });
  
  await exports.respond(event, eventtype, {embeds: [helpMessage]});
  
}



/**
 * @async
 * @command Send a list of players.
 * @param {} event The event (message or interaction) that called this command
 * @param {Object} args Arguments to the command
 * * @argument options Control extra functionality
 * @param {string} eventtype "message" or "interaction"
 */
exports.players = async (event, args, eventtype) => {
  
  if(eventtype == "message"){
    args.options = args.list.slice(0).join(" ").toLowerCase();
  }
  if(args.options == undefined){
    args.options = "";
  }
  
  //Select the emojis to use
  var judgeSymbol = ":judge:";
  var doctorSymbol = ":health_worker:";
  if(event.guildId == "701269326518419547"){
    judgeSymbol = "<:gavel:1073385611551064095>";
    doctorSymbol = "<:doctor:1073369551724617871>";
  }
  
  var playerList = "";
  
  //Update the activity status of all players
  PropositionFunctions.updateActivity();
  
  //Print players in order of PID
  for(var p = 0;p < Players.length;p ++){
    
    if(Players[p].playing){
      
      playerList += "\n" + (p+1) + " - " + Players[p].name + " (<@" + SecureInfo.players[p].ID + ">)";
      
      //Add symbols (inactive, judge/doctor candidate)
      if(!Players[p].active){
        playerList += " :zzz:";
      }
      if(args.options.includes("candidate") || args.options == "c"){
        if(Players[p].judgecandidate){
          playerList += " "+judgeSymbol;
        }
        if(Players[p].pdcandidate){
          playerList += " "+doctorSymbol;
        }
      }else if(Players[p].plaguedoctor){
        playerList += " "+doctorSymbol;
      }
      
    }
    
  }
  
  var reply = new MessageEmbed();
  reply.addFields({ name: "Players:", value: playerList});
  
  await exports.respond(event, eventtype, {embeds: [reply]});
  
}



/**
 * @async
 * @command Return a summary of the current voting status.
 * @param {} event The event (message or interaction) that called this command
 * @param {Object} args Arguments to the command
 * * @argument message The ID of the proposition message
 * * @argument options Control extra functionality
 * @param {string} eventtype "message" or "interaction"
 */
exports.votes = async (event, args, eventtype) => {
  
  if(eventtype == "message"){
    args.message = args.list[0];
    args.options = args.list.slice(1).join(" ").toLowerCase();
  }else if(eventtype == "interaction"){
    //This command tends to take a long time, so defer it to ensure that the command token doesn't expire
    await event.deferReply();
  }
  
  const propositionsChannel = client.channels.cache.get(SecureInfo.channels[1].ID);
  
  if(args.message == undefined){
    //Get a list of ongoing propositions if no ID is given
    
    var responses = [];
    
    for(var p = 0;p < Propositions.length;p ++){
      
      //Only check the status if the proposition is active
      if(!Propositions[p].majority){
        
        //Get the message with the given ID
        var propositionMsg;
        await propositionsChannel.messages.fetch(Propositions[p].messageID).then((msg) => {
          propositionMsg = msg;
        }).catch((err) => {
          console.log("Error finding proposition");
        });
        
        responses.push(await votesCmdOutput(propositionMsg, p, args.options));
        
      }
      
    }
    
    if(responses.length == 0){
      exports.respond(event, eventtype, "No active propositions");
    }else{
      exports.respond(event, eventtype, {embeds: responses});
    }
    
  }else{
    
    //Get the message with the given ID
    var propositionMsg;
    await propositionsChannel.messages.fetch(args.message).then((msg) => {
      propositionMsg = msg;
    }).catch((err) => {
      console.log("Error finding proposition");
    });
    
    //Report an error if the message was not found
    if(typeof(propositionMsg) != "object"){
      exports.respond(event, eventtype, "Error: Unable to identify proposition. The message ID may be incorrect.");
      return;
    }
    
    //Get the ID of the matching stored proposition
    var propositionID = PropositionFunctions.matchProposition(propositionMsg);
    
    //Report an error if a matching stored proposition was not found
    if(propositionID == -1){
      exports.respond(event, eventtype, "Error: Unable to match a stored proposition.");
      logMessage("ERROR: Matching proposition not found");
      return;
    }
    
    
    var reply = await votesCmdOutput(propositionMsg, propositionID, args.options);
    
    await exports.respond(event, eventtype, {embeds: [reply]});
    
  }
  
}



/**
 * @async
 * Given a list of users, return the corresponding player objects and detect illegal votes
 * @param {Message} propositionMsg Main message of the proposition
 * @param {int} propositionID ID of proposition
 * @param {string} options Control extra functionality
 * @returns {MessageEmbed} 
 */
const votesCmdOutput = async (propositionMsg, propositionID, options) => {
  
  //Get the vote status using functionality from propositions.js
  var voteStatus = await PropositionFunctions.getVoteStatus(propositionMsg, propositionID);
  
  //Create a list of names of players who voted each way
  var upvoteList = getAttrList(voteStatus.upvotes,"name");
  var downvoteList = getAttrList(voteStatus.downvotes,"name");
  var rightvoteList = getAttrList(voteStatus.rightvotes,"name");
  
  //Create the reply as an embed
  var response = new MessageEmbed();
  
  response.setDescription("Votes on <@"+propositionMsg.author.id+">'s " + (Propositions[propositionID].judgesuggestion ? "suggestion" : "proposition"));
  
  //Add a field describing the type of majority (if applicable)
  switch(voteStatus.majority){
    case -1:
      var expiryStr = "\nExpires <t:"+(Propositions[propositionID].proposedTimestamp+Config.propositionTimeout*60*60)+":R>";
      response.addFields({ name: "Not yet majority", value: voteStatus.remaining.length+" votes remaining"+expiryStr});
      break;
    case 0:
      response.addFields({ name: "Tie", value: "The proposition has not passed"});
      break;
    case 1:
      response.addFields({ name: "Upvote majority", value: "The proposition has passed"});
      break;
    case 2:
      response.addFields({ name: "Downvote majority", value: "The proposition has been rejected"});
  }
  
  if(options != undefined){
    if(options.includes("remaining") || options == "r"){
      var remainingList = getAttrList(voteStatus.remaining,"name");
      response.addFields({ name: "Remaining:", value: remainingList.length > 0 ? remainingList.join("\n") : "NA"});
    }
  }
  
  response.addFields(
    { name: "Upvotes: "+upvoteList.length, value: upvoteList.length > 0 ? upvoteList.join("\n") : "NA"},
    { name: "Downvotes: "+downvoteList.length, value: downvoteList.length > 0 ? downvoteList.join("\n") : "NA"}
  );
  if(!Propositions[propositionID].judgesuggestion){
    response.addFields({ name: "Rightvotes: "+rightvoteList.length, value: rightvoteList.length > 0 ? rightvoteList.join("\n") : "NA"});
  }
  
  if(voteStatus.illegalVote){
    response.addFields({ name: "Warning", value: "Illegal vote(s) detected"});
  }
  
  response.setTitle("Proposition");
  response.setURL(propositionMsg.url);
  
  //Update the stored proposition data
  PropositionFunctions.updateProposition(propositionMsg, voteStatus);
  
  return response;
  
}



/**
 * @async
 * @command Send information about a specified player
 * @param {} event The event (message or interaction) that called this command
 * @param {Object} args Arguments to the command
 * * @argument player The player to get information about (User ID, PID, or name)
 * @param {string} eventtype "message" or "interaction"
 */
exports.playerinfo = async (event, args, eventtype) => {
  
  if(eventtype == "message"){
    args.player = args.list[0];
  }
  
  var player = Players[identifyPlayer(args.player)];
  if(player == undefined){
    await exports.respond(event, eventtype, "Invalid player.");
    return;
  }
  
  var user = await getUser(SecureInfo.players[player.PID].ID);
  if(user == undefined || user.id != SecureInfo.players[player.PID].ID){
    await exports.respond(event, eventtype, "Unable to get Discord user.");
    return;
  }
  
  var activity = (player.active ? "Active" : "Inactive");
  activity += (player.playing ? "\nPlaying" : "\nNot playing");
  
  var roles = [];
  if(player.judgecandidate){
    roles.push("Judge candidate");
  }
  if(player.pdcandidate){
    roles.push("Plague Doctor candidate");
  }
  if(player.plaguedoctor){
    roles.push("Plague Doctor");
  }
  if(roles.length == 0){
    roles.push("NA");
  }
  
  var humors = [];
  humors.push("Red: "+player.humors.red);
  humors.push("Blue: "+player.humors.blue);
  humors.push("Yellow: "+player.humors.yellow);
  humors.push("Black: "+player.humors.black);
  
  var reply = new MessageEmbed();
  reply.setTitle(player.name);
  reply.setDescription("Player information for <@"+user.id+">");
  reply.addFields(
    { name: "Activity", value: activity},
    { name: "Roles", value: roles.join("\n")},
    { name: "Humors", value: humors.join("\n")}
  );
  reply.setColor(player.iconcolor.substring(1));
  reply.setThumbnail(user.displayAvatarURL());
  
  await exports.respond(event, eventtype, {embeds: [reply]});
  
}



/**
 * @async
 * @command Allow a player to access their vault.
 * @param {} event The event (message or interaction) that called this command
 * @param {Object} args Arguments to the command
 * * @argument command The action to take on the vault
 * @param {string} eventtype "message" or "interaction"
 */
exports.vault = async (event, args, eventtype) => {
  
  var user = event.user;
  
  if(eventtype == "message"){
    args.command = args.list[0];
    args.args = args.list.slice(1,args.length).join(", ");
    user = event.author;
    
    // If the user attempts to access their vault in an insecure location (in a guild), then return a warning and exit.
    if(event.guildId !== null){
      await exports.respond(event, eventtype, "The `vault` text command can only be used in Direct Messages!\nIf you wish to access your vault in this channel, please use the slash command `/vault`.");
      await client.users.send(user, "Please use the `vault` command here.")
      return;
    }
  }
  
  var player = Players[identifyPlayer(user.id)];
  
  //console.log(event);
  //console.log(player);
  //console.log(args);
  
  // Get and decode vault contents
  var vaultContentsEncoded = player.vault;
  var vaultContents = vaultContentsEncoded.map(encString => decodeVaultData(encString) );
  
  //console.log(vaultContentsEncoded);
  //console.log(vaultContents);
  
  if(args.command == "use"){
    // Allow the player to use an item in their vault
  }
  
  // Re-encode the vault contents and store it.
  //var newVaultContentsEncoded = vaultContents.map(obj => encodeVaultData(obj) );
  
  //console.log(newVaultContentsEncoded);
  
  
  // Tell the player their current/new vault contents
  var reply = new MessageEmbed();
  reply.setTitle(player.name + "'s Vault");
  reply.setDescription("Vault contents for <@"+user.id+">");
  for(var i = 0;i < vaultContents.length;i ++){
    var content = vaultContents[i];
    reply.addFields(
      { name: content.name, value: JSON.stringify(content.content, null, 2)}
    );
  }
  reply.setColor(player.iconcolor.substring(1));
  reply.setThumbnail(user.displayAvatarURL());
  
  if(event.guildId !== null){
    await exports.respond(event, eventtype, {embeds: [reply], ephemeral: true});
  }else{
    await exports.respond(event, eventtype, {embeds: [reply]});
  }
  
}



/**
 * @async
 * @command Generate a random number using an unpredictable method
 * @param {} event The event (message or interaction) that called this command
 * @param {Object} args Arguments to the command
 * * @argument lowerbound
 * * @argument upperbound
 * * @argument number Number of random numbers to return
 * @param {string} eventtype "message" or "interaction"
 */
exports.rand = async (event, args, eventtype) => {
  
  var lowerbound = 0;
  var upperbound = 1;
  var number = 1;
  
  if(eventtype == "message"){
    if(args.list.length == 1){
      args.upperbound = args.list[0];
    }else if(args.list.length == 2){
      args.lowerbound = args.list[0];
      args.upperbound = args.list[1];
    }else if(args.list.length == 2){
      args.lowerbound = args.list[0];
      args.upperbound = args.list[1];
      args.number = args.list[2];
    }
  }
  
  if(args.number != undefined){
    number = args.number;
  }
  
  if(args.lowerbound == undefined && args.upperbound == undefined){
    //If no bounds are given, return a random number in the interval [0,1)
    
    var response = "";
    
    for(var n = 0;n < number;n ++){
      response += "\n"+rand().toString()
    }
    
    await exports.respond(event, eventtype, "Random number"+(number > 1 ? "s" : "")+" between 0 and 1:"+response);
    return;
    
  }else if(args.lowerbound == undefined && args.upperbound != undefined){
    //Return a random integer between 0 and the upper bound, inclusive
    
    //Exit with an error message if the given argument is not a number
    if(isNaN(args.upperbound)){
      await exports.respond(event, eventtype, "ERROR: Supplied argument `"+args.upperbound+"` is not a number");
      return;
    }
    
    upperbound = parseInt(args.upperbound.replace(".",""), 10);
    
  }else if(args.lowerbound != undefined && args.upperbound != undefined){
    //Return a random integer between the two arguments, inclusive
    
    //Exit with an error message if any of the arguments are not a number
    if(isNaN(args.lowerbound)){
      await exports.respond(event, eventtype, "ERROR: Supplied argument `"+args.lowerbound+"` is not a number");
      return;
    }
    if(isNaN(args.upperbound)){
      await exports.respond(event, eventtype, "ERROR: Supplied argument `"+args.upperbound+"` is not a number");
      return;
    }
    
    lowerbound = parseInt(args.lowerbound.replace(".",""), 10);
    upperbound = parseInt(args.upperbound.replace(".",""), 10);
    
    if(lowerbound > upperbound){
      await exports.respond(event, eventtype, "ERROR: Lower bound is larger than upper bound");
      return;
    }
    
  }else{
    //Exit with an error if arguments are supplied incorrectly
    
    await exports.respond(event, eventtype, "ERROR: Invalid arguments given. Please refer to the documentation on how to use this command:\n<"+Config.siteURL+"/docs.html#nomic-bot-commands-rand>");
    return;
    
  }
  
  var response = "";
  
  for(var n = 0;n < number;n ++){
    var randint = Math.floor(rand() * (upperbound-lowerbound+1)) + lowerbound;
    response += "\n"+randint;
  }
  
  await exports.respond(event, eventtype, "Random integer"+(number > 1 ? "s" : "")+" between "+lowerbound+" and "+upperbound+":"+response);
  
}



/**
 * @async
 * @command Generate a random number using the default Math.random() function (which is predictable)
 * @param {} event The event (message or interaction) that called this command
 * @param {Object} args Arguments to the command
 * * @argument lowerbound
 * * @argument upperbound
 * @param {string} eventtype "message" or "interaction"
 */
exports.insecurerand = async (event, args, eventtype) => {
  
  var lowerbound = 0;
  var upperbound = 1;
  
  if(eventtype == "message"){
    if(args.list.length == 1){
      args.upperbound = args.list[0];
    }else if(args.list.length == 2){
      args.lowerbound = args.list[0];
      args.upperbound = args.list[1];
    }
  }
  
  if(args.lowerbound == undefined && args.upperbound == undefined){
    //If no arguments are given, return a random number in the interval [0,1)
    
    await exports.respond(event, eventtype, "Number between 0 and 1:\n"+Math.random().toString());
    return;
    
  }else if(args.lowerbound == undefined && args.upperbound != undefined){
    //Return a random integer between 0 and the upper bound, inclusive
    
    //Exit with an error message if the given argument is not a number
    if(isNaN(args.upperbound)){
      await exports.respond(event, eventtype, "ERROR: Supplied argument `"+args.upperbound+"` is not a number");
      return;
    }
    
    upperbound = parseInt(args.upperbound.replace(".",""), 10);
    
  }else if(args.lowerbound != undefined && args.upperbound != undefined){
    //Return a random integer between the two arguments, inclusive
    
    //Exit with an error message if any of the arguments are not a number
    if(isNaN(args.lowerbound)){
      await exports.respond(event, eventtype, "ERROR: Supplied argument `"+args.lowerbound+"` is not a number");
      return;
    }
    if(isNaN(args.upperbound)){
      await exports.respond(event, eventtype, "ERROR: Supplied argument `"+args.upperbound+"` is not a number");
      return;
    }
    
    lowerbound = parseInt(args.lowerbound.replace(".",""), 10);
    upperbound = parseInt(args.upperbound.replace(".",""), 10);
    
    if(lowerbound > upperbound){
      await exports.respond(event, eventtype, "ERROR: Lower bound is larger than upper bound");
      return;
    }
    
  }else{
    //Exit with an error if arguments are supplied incorrectly
    
    await exports.respond(event, eventtype, "ERROR: Invalid arguments given. Please refer to the documentation on how to use this command:\n<"+Config.siteURL+"/docs.html#nomic-bot-commands-rand>");
    return;
    
  }
  
  var randint = Math.floor(Math.random() * (upperbound-lowerbound+1)) + lowerbound;
  
  await exports.respond(event, eventtype, "Random integer between "+lowerbound+" and "+upperbound+":\n"+randint);
  
}



/**
 * @async
 * @command Generate a random number in a more user-friendly way by rolling virtual dice.
 * @param {} event The event (message or interaction) that called this command
 * @param {Object} args Arguments to the command
 * * @argument amount
 * * @argument size
 * @param {string} eventtype "message" or "interaction"
 */
exports.roll = async (event, args, eventtype) => {
  
  var size = 6;
  var amount = 1;
  
  if(eventtype == "interaction"){
    
    if(args.size != undefined){
      size = parseInt(args.size, 10);
      if(isNaN(args.size)){
        await exports.respond(event, eventtype, "ERROR: Supplied argument `"+args.size+"` is not a valid numeric input");
        return;
      }
    }
    
    if(args.amount != undefined){
      amount = parseInt(args.amount, 10);
      if(isNaN(args.amount)){
        await exports.respond(event, eventtype, "ERROR: Supplied argument `"+args.amount+"` is not a valid numeric input");
        return;
      }
    }
    
  }else if(eventtype == "message"){
    
    //If only a single parameter is given
    if(args.list.length == 1){
      
      var arg = args.list[0].toLowerCase().replaceAll(".","");
      
      if(arg.includes("d")){
        
        var params = arg.split("d");
        
        if(params[0] != "" && !isNaN(params[0])){
          amount = parseInt(params[0], 10);
        }
        if(params[1] != "" && !isNaN(params[1])){
          size = parseInt(params[1], 10);
        }
        
      }else{
        
        if(isNaN(arg) || arg === ""){
          await exports.respond(event, eventtype, "ERROR: Supplied argument `"+args.list[0]+"` is not a valid numeric input");
          return;
        }
        
        size = parseInt(arg, 10);
        
      }
      
    }else{
      
      //Iterate through the given arguments
      for(var a = 0;a < 2 && a < args.list.length;a ++){
        
        var arg = args.list[a].toLowerCase().replaceAll(".","");
        
        if(arg.includes("d")){
          
          //If the argument contains "d", then this must be the size of the dice
          
          var num = arg.replace("d","");
          
          if(isNaN(num) || num === ""){
            await exports.respond(event, eventtype, "ERROR: Supplied argument `"+args.list[a]+"` is not a valid numeric input");
            return;
          }
          
          size = parseInt(num, 10);
          
        }else if(args.list[a].includes("x")){
          
          //If the argument contains "x", then this must be the amount of dice to roll
          
          var num = arg.replace("x","");
          
          console.log(num);
          
          if(isNaN(num) || num === ""){
            await exports.respond(event, eventtype, "ERROR: Supplied argument `"+args.list[a]+"` is not a valid numeric input");
            return;
          }
          
          amount = parseInt(num, 10);
          
        }else{
          
          //If the argument does not contain "d" or "x", then treat the first arg as the amount and the second as the die size
          
          if(isNaN(arg) || arg === ""){
            await exports.respond(event, eventtype, "ERROR: Supplied argument `"+args.list[a]+"` is not a valid numeric input");
            return;
          }
          
          if(a === 0){
            amount = parseInt(arg, 10);
          }else if(a === 1){
            size = parseInt(arg, 10);
          }
          
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
    rolls.push( Math.floor(rand() * size) + 1 );
  }
  
  var reply = "Rolling "+amount+" D"+size+":\n" + rolls.join(", ");
  if(amount > 1){
    var sum = 0;
    for(var r = 0;r < rolls.length;r ++){
      sum += rolls[r];
    }
    reply += "\nSum: "+sum;
  }
  
  //Send a message with the list of dice rolls
  await exports.respond(event, eventtype, reply);
  
}



/**
 * @async
 * @command Randomise a list of numbers or strings.
 * @param {} event The event (message or interaction) that called this command
 * @param {Object} args Arguments to the command
 * * @argument items A space- or comma-delimited list of strings to randomise the order of
 * @param {string} eventtype "message" or "interaction"
 */
exports.listrand = async (event, args, eventtype) => {
  
  var list = [];
  
  //Return an error message if no arguments are given
  if(args.list.length == 0){
    
    await exports.respond(event, eventtype, "ERROR: Please ensure that you supply a valid argument to this command. For more information:\n<"+Config.siteURL+"/docs.html#nomic-bot-commands-listrand>");
    return;
    
  }
  
  //Combine all the arguments together into a single string
  var arg = "";
  for(var a = 0;a < args.list.length;a ++){
    
    arg += args.list[a];
    
    if(a != args.list.length-1){
      arg += ",";
    }
    
  }
  
  if(args.list.length > 1 || arg.includes(" ") || arg.includes(",")){
    
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
    var j = Math.floor(rand()*list.length);
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
 * @param {Object} args Arguments to the command
 * @param {string} eventtype "message" or "interaction"
 */
exports.randplayer = async (event, args, eventtype) => {
  
  var p = Math.floor(rand()*Players.length);
  
  var player = Players[p];
  
  await exports.respond(event, eventtype, player.name);
  
}



/**
 * @async
 * @command Return the player list in a random order.
 * @param {} event The event (message or interaction) that called this command
 * @param {Object} args Arguments to the command
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
 * @param {Object} args Arguments to the command
 * * @argument message The ID of the proposition message
 * @param {string} eventtype "message" or "interaction"
 */
exports.addprop = async (event, args, eventtype) => {
  
  var propositionsChannel = client.channels.cache.get(SecureInfo.channels[1].ID);
  
  //Get the message with the given ID
  var propositionMsg;
  await propositionsChannel.messages.fetch(args.list[0]).then((msg) => {
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
 * @command Manually add a new proposition to storage.
 * @param {} event The event (message or interaction) that called this command
 * @param {Object} args Arguments to the command
 * * @argument type Judge (j) or Plague Doctor (pd)
 * * @argument player The player to become a candidate (User ID, PID, or name)
 * @param {string} eventtype "message" or "interaction"
 */
exports.addcandidate = async (event, args, eventtype) => {
  
  if(eventtype == "message"){
    args.type = args.list[0];
    args.player = args.list[1];
  }
  if(args.type == undefined || args.player == undefined){
    await exports.respond(event, eventtype, "Invalid arguments. Please supply a valid candidate type and player ID.");
    return;
  }
  
  var player = Players[identifyPlayer(args.player)];
  if(player == undefined){
    await exports.respond(event, eventtype, "Invalid player.");
    return;
  }
  
  var type = undefined;
  var action = undefined;
  
  if(args.type.toLowerCase() == "j" || args.type.toLowerCase() == "judge"){
    type = "Judge";
    action = (player.judgecandidate ? "Removed" : "Added");
    player.judgecandidate = !player.judgecandidate;
  }else if(args.type.toLowerCase() == "pd" || args.type.toLowerCase() == "plague doctor"){
    type = "Plague Doctor";
    action = (player.pdcandidate ? "Removed" : "Added");
    player.pdcandidate = !player.pdcandidate;
  }
  
  if(type == undefined || action == undefined){
    await exports.respond(event, eventtype, "Invalid type.");
    return;
  }
  
  updateFile("players");
  
  await exports.respond(event, eventtype, action+" "+player.name+" as a "+type+" candidate.");
  
}



/**
 * @async
 * @command Randomly pick a Judge out of the possible candidates.
 * @param {} event The event (message or interaction) that called this command
 * @param {Object} args Arguments to the command
 * @param {string} eventtype "message" or "interaction"
 */
exports.choosejudge = async (event, args, eventtype) => {
  
  var candidates = [];
  
  for(var p = 0;p < Players.length;p ++){
    
    if(Players[p].judgecandidate){
      candidates.push(Players[p]);
    }
    
  }
  
  if(candidates.length == 0){
    await exports.respond(event, eventtype, "No Judge candidates available.");
    return;
  }
  
  var judge = candidates[ Math.floor(rand()*candidates.length) ];
  
  await exports.respond(event, eventtype, "Chosen Judge: "+judge.name);
  
}



/**
 * @async
 * @command Randomly pick a Plague Doctor out of the possible candidates.
 * @param {} event The event (message or interaction) that called this command
 * @param {Object} args Arguments to the command
 * @param {string} eventtype "message" or "interaction"
 */
exports.choosedoctor = async (event, args, eventtype) => {
  
  var candidates = [];
  
  for(var p = 0;p < Players.length;p ++){
    
    if(Players[p].pdcandidate){
      candidates.push(Players[p]);
    }
    
  }
  
  if(candidates.length == 0){
    await exports.respond(event, eventtype, "No Plague Doctor candidates available.");
    return;
  }
  
  var doctor = candidates[ Math.floor(rand()*candidates.length) ];
  
  await exports.respond(event, eventtype, "Chosen Plague Doctor: "+doctor.name);
  
}



/**
 * @async
 * @command Change one of a player's humor values
 * @param {} event The event (message or interaction) that called this command
 * @param {Object} args Arguments to the command
 * * @argument mode 'Set', 'Add', or 'Subtract'
 * * @argument player Player ID or name
 * * @argument humor 'Red', 'Blue', 'Yellow', or 'Black'
 * * @argument value New humor value
 * @param {string} eventtype "message" or "interaction"
 */
exports.updatehumor = async (event, args, eventtype) => {
  
  if(eventtype == "message"){
    args.mode = args.list[0];
    args.player = args.list[1];
    args.humor = args.list[2];
    args.value = args.list[3];
  }
  //Return an error if the arguments are obviously wrong
  if(args.player == undefined || args.humor == undefined || isNaN(args.value)){
    await exports.respond(event, eventtype, "Invalid arguments. Please supply a valid player, humor, and value.");
    return;
  }
  
  //Identify the player
  var player = Players[identifyPlayer(args.player)];
  //Return an error if a matching player was not found.
  if(player == undefined){
    await exports.respond(event, eventtype, "Invalid player.");
    return;
  }
  
  //Return an error if the specified humor type is invalid.
  if(args.humor.toLowerCase() != "red" && args.humor.toLowerCase() != "blue" && args.humor.toLowerCase() != "yellow" && args.humor.toLowerCase() != "black"){
    await exports.respond(event, eventtype, "Invalid humor - must be one of: 'red', 'blue', 'yellow', or 'black'.");
    return;
  }
  
  var value = parseInt(args.value);
  
  if(args.mode == undefined || args.mode.toLowerCase() == "set"){
    //Overwrite the value
    player.humors[args.humor.toLowerCase()] = value;
    await exports.respond(event, eventtype, "Set "+player.name+"'s "+args.humor.toLowerCase()+" humor points to "+value+".");
    
  }else if(args.mode.toLowerCase() == "add"){
    //Add the value
    player.humors[args.humor.toLowerCase()] += value;
    await exports.respond(event, eventtype, "Added "+value+" to "+player.name+"'s "+args.humor.toLowerCase()+" humor points.");
    
  }else if(args.mode.toLowerCase().includes("sub")){
    //Subtract the value
    player.humors[args.humor.toLowerCase()] -= value;
    await exports.respond(event, eventtype, "Subtracted "+value+" from "+player.name+"'s "+args.humor.toLowerCase()+" humor points.");
    
  }else{
    //Return an error
    await exports.respond(event, eventtype, "Invalid mode - must be one of: 'set', 'add', or 'subtract'.");
    return;
  }
  
  updateFile("players");
  
}



/**
 * @async
 * @command DESCRIPTION.
 * @param {} event The event (message or interaction) that called this command
 * @param {Object} args Arguments to the command
 * * @argument command DESCRIPTION
 * @param {string} eventtype "message" or "interaction"
 */
exports.plaguedoctor = async (event, args, eventtype) => {
  
  var user = event.user;
  
  // If the user attempts to access their vault in an insecure location (in a guild), then return a warning and exit.
  if(event.guildId !== null){
    await exports.respond(event, eventtype, "The `vault` command can only be used in Direct Messages!");
    await client.users.send(user, "Please use the `vault` command here.")
    return;
  }
  
  if(eventtype == "message"){
    args.command = args.list[0];
    args.args = args.list.slice(1,args.length).join(", ");
    user = event.author;
  }
  
  var player = Players[identifyPlayer(user.id)];
  
  //console.log(event);
  //console.log(player);
  //console.log(args);
  
  // Get and decode vault contents
  var vaultContentsEncoded = player.vault;
  var vaultContents = vaultContentsEncoded.map(encString => decodeVaultData(encString) );
  
  //console.log(vaultContentsEncoded);
  //console.log(vaultContents);
  
  // Default behaviour: list the player's current spell submissions for this oscillation.
  
  if(args.command == "use"){
    // Allow the player to use an item in their vault
  }
  
  // Re-encode the vault contents and store it.
  //var newVaultContentsEncoded = vaultContents.map(obj => encodeVaultData(obj) );
  
  //console.log(newVaultContentsEncoded);
  
  
  // Tell the player their current/new vault contents
  var reply = new MessageEmbed();
  reply.setTitle(player.name + "'s Vault");
  reply.setDescription("Vault contents for <@"+user.id+">");
  for(var i = 0;i < vaultContents.length;i ++){
    var content = vaultContents[i];
    reply.addFields(
      { name: content.name, value: JSON.stringify(content.content, null, 2)}
    );
  }
  reply.setColor(player.iconcolor.substring(1));
  reply.setThumbnail(user.displayAvatarURL());
  
  await exports.respond(event, eventtype, {embeds: [reply]});
  
}



/**
 * @async
 * @command Send a list of spells.
 * @param {} event The event (message or interaction) that called this command
 * @param {Object} args Arguments to the command
 * @param {string} eventtype "message" or "interaction"
 */
exports.listspells = async (event, args, eventtype) => {
  
  var spellList = new MessageEmbed();
  
  spellList.setTitle("Spell List");
  //spellList.setDescription("List of all spells currently available");
  spellList.addFields(
    { name: "[spell name]", value: "[type]\n[cost]\n[required params]"},
    { name: "[spell name]", value: "[type]\n[cost]\n[required params]"}
  );
  spellList.setFooter({
    text: "See the website for more details"
  });
  
  await exports.respond(event, eventtype, {embeds: [spellList]});
  
}



/**
 * @async
 * @command DESCRIPTION.
 * @param {} event The event (message or interaction) that called this command
 * @param {Object} args Arguments to the command
 * * @argument command DESCRIPTION
 * @param {string} eventtype "message" or "interaction"
 */
exports.cast = async (event, args, eventtype) => {
  
  var user = event.user;
  
  // If the user attempts to access their vault in an insecure location (in a guild), then return a warning and exit.
  if(event.guildId !== null){
    await exports.respond(event, eventtype, "The `vault` command can only be used in Direct Messages!");
    await client.users.send(user, "Please use the `vault` command here.")
    return;
  }
  
  if(eventtype == "message"){
    args.command = args.list[0];
    user = event.author;
    
    if(args.list.length > 1){
      await exports.respond(event, eventtype, "A text version of this command is not available, please use /cast instead.");
      return;
    }
  }
  
  console.log(args);
  
  var caster = Players[identifyPlayer(user.id)];
  
  // Validate & identify the spell from the given name
  if(args.spell == undefined){
    await exports.respond(event, eventtype, "You must provide a valid spell for this command.");
    return;
  }
  var spell = Magic.spells[ Magic.spells.map(spell => spell.name.toLowerCase()).indexOf(args.spell.toLowerCase()) ];
  if(spell == undefined){
    await exports.respond(event, eventtype, `"${args.spell}" is not the name of a spell.`);
    return;
  }
  
  // Validate & identify the player targets of the spell
  var targets = [];
  if(args.targets != undefined){
    targets = args.targets.replace(" ","").replace(",",";").split(";").map(name => identifyPlayer(name));
    
    for(var t = 0;t < targets.length;t ++){
      if(targets[t] == undefined){
        await exports.respond(event, eventtype, `"${args.targets.replace(" ","").replace(",",";").split(";")[t]}" is not a valid player.`);
        return;
      }
    }
  }
  
  // Validate & identify the given Humors
  var humors = [];
  if(args.humors != undefined){
    humors = args.humors.replace(" ","").toLowerCase().replace(",",";").split(";");
    
    for(var h = 0;h < humors.length;h ++){
      if(!["r","b","y","k","red","blue","yellow","black"].includes(humors[h])){
        await exports.respond(event, eventtype, `"${humors[h]}" is not a valid Humor.`);
        return;
      }
    }
  }
  
  // Check against the spell requirements
  var numReqTargets = spell.requires.filter(r => r == "P").length;
  if(numReqTargets != targets.length){
    await exports.respond(event, eventtype, `This spell requires ${numReqTargets} player target(s).`);
    return;
  }
  
  var numReqHumors = spell.requires.filter(r => r == "H").length;
  if(numReqHumors != humors.length){
    await exports.respond(event, eventtype, `This spell requires ${numReqHumors} Humor(s).`);
    return;
  }
  
  Magic.storePlayerSpellCast(caster, spell, targets, humors);
  
  await exports.respond(event, eventtype, "Spell submitted");
  
}



/**
 * @async
 * @command Run a git command - can only be used by the system maintainer
 * @param {} event The event (message or interaction) that called this command
 * @param {Object} args Arguments to the command
 * * @argument command
 * * @argument parameters
 * @param {string} eventtype "message" or "interaction"
 */
exports.git = async (event, args, eventtype) => {
  
  //Only allow the system maintainer to use git commands (for now)
  if(event.author.id != SecureInfo.players[0].ID){
    exports.respond(event, eventtype, "You are not authorised to perform this action");
    return;
  }
  
  switch(args.list[0]){
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
      if(args.list.length > 1){
        commitMsg = args.list.slice(1).join(" ");
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
 * @param {Object} args Arguments to the command
 * * @argument message The ID of the Discord message to get information about
 * * @argument channel The Discord ID or NAS internal ID of the Discord channel which the message is within
 * @param {string} eventtype "message" or "interaction"
 */
exports.msginfo = async (event, args, eventtype) => {
  
  //This command always requires 2 arguments, so exit if less than 2 are given
  if(args.list.length < 2){
    await exports.respond(event, eventtype, "ERROR: Please ensure that you supply the message ID and channel ID. For more information:\n<"+Config.siteURL+"/docs.html#nomic-bot-commands-msginfo>");
    return;
  }
  
  if(eventtype == "message"){
    args.message = args.list[0];
    args.channel = args.list[1];
  }
  
  //Get the channel
  var channel;
  if(args.channel.length > 2){
    channel = client.channels.cache.get(args.channel);
  }else{
    var channelID = SecureInfo.channels[ parseInt(args.channel,10) ]?.ID;
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
  await channel.messages.fetch(args.message).then((msg) => {
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
  
  reply.setDescription("Information about message with ID "+args.message);
  
  var createdTSRounded = Math.round(message.createdTimestamp/1000).toString();
  var editedTSRounded = Math.round(message.editedTimestamp/1000).toString();
  var createdTS = (message.createdTimestamp/1000).toString();
  var editedTS = (message.editedTimestamp/1000).toString();
  
  reply.addFields(
    { name: "Timestamp", value: createdTS + " (<t:"+createdTSRounded+">)"},
    { name: "Author", value: "<@"+message.author.id+">"}
  );
  if(message.editedTimestamp != null){
    reply.addFields(
      { name: "Edited Timestamp", value: editedTS + " (<t:"+editedTSRounded+">)"}
    );
  }
  reply.addFields(
    { name: "URL", value: message.url}
  );
  //reply.setURL(message.url); //I don't know what this does, but it doesn't appear to change anything for regular users
  
  await exports.respond(event, eventtype, {embeds: [reply]});
  
}



/**
 * @async
 * @command Get the content of a Discord message.
 * @param {} event The event (message or interaction) that called this command
 * @param {Object} args Arguments to the command
 * * @argument message The ID of the Discord message to get information about
 * * @argument channel The Discord ID or NAS internal ID of the Discord channel which the message is within
 * @param {string} eventtype "message" or "interaction"
 */
exports.msgcontent = async (event, args, eventtype) => {
  
  if(args.list.length < 2){
    await exports.respond(event, eventtype, "ERROR: Please ensure that you supply the message ID and channel ID. For more information:\n<"+Config.siteURL+"/docs.html#nomic-bot-commands-msginfo>");
    return;
  }
  
  if(eventtype == "message"){
    args.message = args.list[0];
    args.channel = args.list[1];
  }
  
  //Get the channel
  var channel;
  if(args.channel.length > 2){
    channel = client.channels.cache.get(args.channel);
  }else{
    var channelID = SecureInfo.channels[ parseInt(args.channel,10) ]?.ID;
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
  await channel.messages.fetch(args.message).then((msg) => {
    message = msg;
  }).catch((err) => {
    console.log("Error finding message");
  });
  
  //Report an error if the message was not found
  if(typeof(message) != "object"){
    await exports.respond(event, eventtype, "ERROR: Message not found. Please ensure you supplied the correct channel ID and a valid message ID.");
    return;
  }
  
  
  var reply = "```"+message.content+"```";
  
  await exports.respond(event, eventtype, reply);
  
}



/**
 * @async
 * @command Attempt to parse the proposition and output the resulting JSON as a file
 * @param {} event The event (message or interaction) that called this command
 * @param {Object} args Arguments to the command
 * * @argument message The ID of the proposition message
 * @param {string} eventtype "message" or "interaction"
 */
exports.parse = async (event, args, eventtype) => {
  
  var propositionsChannel = client.channels.cache.get(SecureInfo.channels[1].ID);
  
  if(eventtype == "message"){
    args.message = args.list[0];
  }
  
  //Get the message with the given ID
  var propositionMsg;
  await propositionsChannel.messages.fetch(args.message).then((msg) => {
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
  
  
  //Parse the proposition
  //var parsed = PropositionParsing.parse(Propositions[propositionID].content);
  
  //Output a JSON file with the stringified parsing output
  await exports.respond(event, eventtype, "Awaiting implementation");
  
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
    name: "players",
    description: "List players of the current Season",
    func: exports.players,
    options: [
      {
        name: "options",
        description: "Control extra functionality"
      }
    ]
  },
  {
    name: "playerinfo",
    description: "Get information about a player",
    func: exports.playerinfo,
    options: [
      {
        name: "player",
        description: "Player ID or name"
      }
    ]
  },
  {
    name: "vault",
    description: "Access your vault",
    func: exports.vault,
    options: [
      {
        name: "command",
        description: "Action to take on your vault"
      },
      {
        name: "args",
        description: "Arguments for the vault command"
      }
    ]
  },
  {
    name: "rand",
    description: "Generate random numbers",
    func: exports.rand,
    options: [
      {
        name: "lowerbound",
        description: "Lowest integer returned"
      },
      {
        name: "upperbound",
        description: "Highest integer returned"
      },
      {
        name: "number",
        description: "Number of numbers returned"
      }
    ]
  },
  {
    name: "insecurerand",
    description: "Generate random numbers using the predictable Math.random() function",
    func: exports.insecurerand,
    options: [
      {
        name: "lowerbound",
        description: "Lowest integer returned"
      },
      {
        name: "upperbound",
        description: "Highest integer returned"
      }
    ]
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
    name: "addcandidate",
    description: "Add/remove a Judge or Plague Doctor candidate",
    func: exports.addcandidate,
    options: [
      {
        name: "type",
        description: "Plague Doctor or Judge"
      },
      {
        name: "player",
        description: "Player ID or name"
      }
    ]
  },
  {
    name: "choosejudge",
    description: "Randomly pick a Judge out of the possible candidates",
    func: exports.choosejudge
  },
  {
    name: "choosedoctor",
    description: "Randomly pick a Plauge Doctor out of the possible candidates",
    func: exports.choosedoctor
  },
  {
    name: "updatehumor",
    description: "Change a player's humor values",
    func: exports.updatehumor,
    options: [
      {
        name: "mode",
        description: "'Set', 'Add', or 'Subtract'"
      },
      {
        name: "player",
        description: "Player ID or name"
      },
      {
        name: "humor",
        description: "'Red', 'Blue', 'Yellow', or 'Black'"
      },
      {
        name: "value",
        description: "New humor value"
      }
    ]
  },
  {
    name: "plaguedoctor",
    description: "Interact with the Plague Doctor",
    func: exports.plaguedoctor,
    options: [
      {
        name: "spell",
        description: "The name of a spell to cast"
      },
      {
        name: "target",
        description: "A player (or players) for the spell to target"
      },
      {
        name: "humor",
        description: "A Humor (or Humors) for the spell to use and/or target"
      }
    ]
  },
  {
    name: "listspells",
    description: "List all magic spells and their casting requirements",
    func: exports.listspells
  },
  {
    name: "cast",
    description: "Cast a spell",
    func: exports.cast,
    options: [
      {
        name: "spell",
        description: "The name of the spell to cast"
      },
      {
        name: "targets",
        description: "Player(s) for the spell to target"
      },
      {
        name: "humors",
        description: "Humor(s) for the spell to use and/or target"
      }
    ]
  },
  //{
  //  name: "clearspells",
  //  description: "Clear all spell slots for this oscillation",
  //  func: exports.clearspells
  //},
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
  },
  {
    name: "msgcontent",
    description: "Get the content of a message",
    func: exports.msgcontent,
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
  },
  {
    name: "parse",
    description: "Attempt to parse a proposition",
    func: exports.parse,
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
  }
];
