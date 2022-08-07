/**
 * Proposition functionality module
 * 
 * @author Anthony Wilson
 */



"use strict";



/**
 * @async
 * Add a new proposition to the list, and add reactions to the proponent's message.
 * Called when a player sends a message in #propositions.
 * @param {Message} message The message containing the proposition
 */
exports.createProposition = async (message) => {
  
  var upvoteEmoji = message.guild.emojis.cache.get(Config.emoji.upvote);
  var downvoteEmoji = message.guild.emojis.cache.get(Config.emoji.downvote);
  var leftvoteEmoji = message.guild.emojis.cache.get(Config.emoji.leftvote);
  var rightvoteEmoji = message.guild.emojis.cache.get(Config.emoji.rightvote);
  //var upvoteEmoji = "👍";
  //var downvoteEmoji = "👎";
  
  //React to the message with the vote emoji
  message.react(upvoteEmoji).then(() => {
    message.react(downvoteEmoji).then(() => {
      message.react(leftvoteEmoji).then(() => {
        message.react(rightvoteEmoji);
      });
    });
  });
  
  var proponent = identifyPlayer(message.author.id);
  
  //Check if the proponent already has an active proposition
  for(var p = Propositions.length-1;p >= 0;p --){
    if(Propositions[p].author == proponent){
      if(!Propositions[p].majority){
        if(p == Propositions.length-1){
          
          //Instead of adding a separate proposition, add the second message to the proposition object (making it a "multi-message proposition")
          if(Propositions[p].multimessage){
            Propositions[p].messages.push(message.id);
          }else{
            Propositions[p].multimessage = true;
            Propositions[p].messages = [Propositions[p].messageID, message.id];
          }
          Propositions[p].messageID = message.id; //Use the ID of the last message sent
          Propositions[p].content += "\n\n" + message.content;
          
          updateFile("propositions");
          
          logMessage("Appended message to multi-message proposition.");
          
          return;
          
        }else{
          logMessage("WARNING: "+Players[proponent]+" may have illegally proposed.");
        }
      }else{
        p = -1;
      }
    }
  }
  
  //Add the proposition to the list
  Propositions.push({
    author: proponent,
    content: message.content,
    timestamp: Math.round(message.createdTimestamp/1000),
    messageID: message.id,
    votes: [[],[],[],[]],
    majority: false,
    link: message.url
  });
  
  if(message.content.split("\n")[0].toLowerCase().includes("judge")){
    Propositions[Propositions.length-1].judgesuggestion = true;
  }
  
  //Update propositions.json
  updateFile("propositions");
  
  logMessage("New proposition created");
  
  //Update the activity status of all players
  exports.updateActivity();
  
  await client.channels.cache.get(SecureInfo.channels[2].ID).send("<@&977412127121879100> "+Players[proponent].name+" has made a proposition.\n"+message.url);
  
}



/**
 * @async
 * Called when a user reacts to a message in #propositions.
 * @param {ReactionManager} reaction The reaction to the message containing the proposition
 */
exports.handleVote = async (reaction) => {
  
  console.log("Vote detected");
  
  exports.updateProposition(reaction.message);
  
}



/**
 * @async
 * Update the votes on a proposition. Make an announcement if it reaches a majority.
 * @param {Message} message The message containing the proposition (can also be an integer specifying the ID of the proposition)
 * @param {Object} votes (Optional) The votes on the proposition
 */
exports.updateProposition = async (proposition, votes) => {
  
  var message;
  var prop = -1;
  
  if(typeof(proposition) == "object"){
    
    message = proposition;
    
    //Identify the matching proposition object
    prop = exports.matchProposition(message);
    
  }else if(typeof(proposition) == "number"){
    
    prop = proposition;
    
    await client.channels.cache.get(SecureInfo.channels[1].ID).messages.fetch(Propositions[prop].messageID).then((msg) => {
      message = msg;
    }).catch((err) => {
      console.log("Error finding proposition");
    });
    
  }
  
  //Report an error if the message was not found
  if(typeof(message) != "object"){
    logMessage("ERROR: Proposition not found");
    return;
  }
  
  //Report an error if a matching stored proposition was not found
  if(prop == -1){
    logMessage("**Warning**: Cannot update uncached proposition");
    return;
  }
  
  //Update the activity status of all players
  //This function already takes a long time to run without this, so I have disabled it for now
  //exports.updateActivity();
  
  //Store the vote status
  var voteStatus;
  if(votes != undefined){
    voteStatus = votes;
  }else{
    voteStatus = await exports.getVoteStatus(message, prop);
  }
  
  var reachedMajority = Propositions[prop].majority;
  
  //Only announce a majority if it has not already been announced
  if(!Propositions[prop].majority){
    
    var majorityAnnouncementChannel = client.channels.cache.get(SecureInfo.channels[2].ID);
    
    switch(voteStatus.majority){
      case 0:
        console.log("Proposition has tied");
        majorityAnnouncementChannel.send("<@"+message.author.id+">'s proposition has tied, so it has not passed.\n"+message.url);
        reachedMajority = true;
        break;
      case 1:
        console.log("Proposition reached upvote majority");
        majorityAnnouncementChannel.send("<@"+message.author.id+">'s proposition has passed, and must be added to the rule tree.\n"+message.url);
        reachedMajority = true;
        break;
      case 2:
        console.log("Proposition reached downvote majority");
        majorityAnnouncementChannel.send("<@"+message.author.id+">'s proposition has reached downvote majority, so it has not passed.\n"+message.url);
        reachedMajority = true;
        break;
      case 3:
        console.log("Proposition reached leftvote majority");
        majorityAnnouncementChannel.send("<@"+message.author.id+">'s proposition has reached leftvote majority, and must be re-proposed within 72 hours.\n"+message.url);
        reachedMajority = true;
    }
    
  }
  
  var upvotes = getAttrList(voteStatus.upvotes,"PID");
  var downvotes = getAttrList(voteStatus.downvotes,"PID");
  var leftvotes = getAttrList(voteStatus.leftvotes,"PID");
  var rightvotes = getAttrList(voteStatus.rightvotes,"PID");
  
  if(!Propositions[prop].multimessage){
    if(Propositions[prop].content != message.content){
      logMessage("This proposition has been edited, and needs to be updated");
    }
  }
  
  //Stop here if majority has already been reached.
  if(Propositions[prop].majority){
    return;
  }
  
  if(reachedMajority){
    message.react("✅");
  }
  
  
  //Update the votes
  Propositions[prop].votes[0] = JSON.parse(JSON.stringify(upvotes));
  Propositions[prop].votes[1] = JSON.parse(JSON.stringify(downvotes));
  Propositions[prop].votes[2] = JSON.parse(JSON.stringify(leftvotes));
  Propositions[prop].votes[3] = JSON.parse(JSON.stringify(rightvotes));
  
  //Update the content (only if it is a single-message proposition)
  if(!Propositions[prop].multimessage){
    Propositions[prop].content = message.content;
  }
  
  //Update the majority status of the proposition
  Propositions[prop].majority = reachedMajority;
  
  updateFile("propositions");
  
}



/**
 * @async
 * Get the vote status of a proposition.
 * @param {Message} message The message containing the proposition
 * @param {int} propositionID ID of the proposition
 * @returns {Object} A single object "output" containing vote information
 */
exports.getVoteStatus = async (message, propositionID) => {
  
  /**
   * Returned by this function
   * @property {integer} majority The type of majority (if applicable).
   * * -1 = no majority
   * * 0 = tie
   * * 1 = upvote majority
   * * 2 = downvote majority
   * * 3 = leftvote majority
   * @property {[Player]} upvotes Array of players who upvoted
   * @property {[Player]} downvotes Array of players who downvoted
   * @property {[Player]} leftvotes Array of players who leftvoted
   * @property {[Player]} rightvotes Array of players who rightvoted
   * @property {[Player]} remaining Array of players who are yet to vote
   * @property {boolean} illegalVote Whether or not a user has voted on the proposition in a way which violates the rules
   */
  var output = {
    majority: -1,
    upvotes: [],
    downvotes: [],
    leftvotes: [],
    rightvotes: [],
    remaining: [],
    illegalVote: false
  };
  
  
  //Store the PID of the proponent
  var proponent = identifyPlayer(message.author.id);
  
  
  //Get the players who upvoted
  var upvoteUsers = await message.reactions.cache.get(Config.emoji.upvote)?.users.fetch();
  var upvotePlayers = getVotePlayers(upvoteUsers, proponent, propositionID);
  output.upvotes = upvotePlayers.players;
  
  //Get the players who downvoted
  var downvoteUsers = await message.reactions.cache.get(Config.emoji.downvote)?.users.fetch();
  var downvotePlayers = getVotePlayers(downvoteUsers, proponent, propositionID);
  output.downvotes = downvotePlayers.players;
  
  //Get the players who leftvoted
  var leftvoteUsers = await message.reactions.cache.get(Config.emoji.leftvote)?.users.fetch();
  var leftvotePlayers = getVotePlayers(leftvoteUsers, proponent, propositionID);
  output.leftvotes = leftvotePlayers.players;
  
  //Get the players who rightvoted
  var rightvoteUsers = await message.reactions.cache.get(Config.emoji.rightvote)?.users.fetch();
  var rightvotePlayers = getVotePlayers(rightvoteUsers, proponent, propositionID);
  output.rightvotes = rightvotePlayers.players;
  
  //Detect any illegal votes
  output.illegalVote = (upvotePlayers.illegalVote || downvotePlayers.illegalVote || leftvotePlayers.illegalVote || rightvotePlayers.illegalVote);
  
  
  //Count how many times each player voted
  var votedPlayers = [];
  for(var p = 0;p < Players.length;p ++){
    votedPlayers.push(0);
  }
  //Check upvotes
  for(var p = 0;p < output.upvotes.length;p ++){
    votedPlayers[output.upvotes[p].PID] ++;
  }
  //Check downvotes
  for(var p = 0;p < output.downvotes.length;p ++){
    votedPlayers[output.downvotes[p].PID] ++;
  }
  //Check leftvotes
  for(var p = 0;p < output.leftvotes.length;p ++){
    votedPlayers[output.leftvotes[p].PID] ++;
  }
  //Add rightvotes for past players
  for(var p = 0;p < Players.length;p ++){
    if(!Players[p].playing){
      output.rightvotes.push(Players[p]);
      votedPlayers[p] ++;
    }
  }
  //Check if the proposition is more than 12 hours old
  if(Math.round((new Date()).getTime()/1000) > Propositions[propositionID].timestamp+12*60*60 && !Propositions[propositionID].judgesuggestion){
    //Add rightvotes for inactive players
    for(var p = 0;p < Players.length;p ++){
      if(!Players[p].active && votedPlayers[p] == 0){
        output.rightvotes.push(Players[p]);
      }
    }
  }
  //Check rightvotes
  for(var p = 0;p < output.rightvotes.length;p ++){
    votedPlayers[output.rightvotes[p].PID] ++;
    if(!output.rightvotes[p].playing){
      votedPlayers[output.rightvotes[p].PID] = 1;
    }
  }
  for(var p = 0;p < votedPlayers.length;p ++){
    
    if(votedPlayers[p] == 0){
      
      if(p != proponent){
        //Player has not voted yet - add to "output.remaining" array
        output.remaining.push(Players[p]);
      }
      
    }else if(votedPlayers[p] > 1){
      
      //If the player has voted more than once, it is an illegal vote
      output.illegalVote = true;
      //Ensure that a majority is not returned, as it would involve the illegal vote
      output.majority = -1;
      //Return the results, because majority checks are unnecessary
      return output;
      
    }
    
  }
  
  
  //Sanity check
  var totalVotes = output.upvotes.length + output.downvotes.length + output.leftvotes.length + output.rightvotes.length;
  if(totalVotes + output.remaining.length != Players.length-(Propositions[propositionID].judgesuggestion ? 0 : 1)){
    logMessage("**Warning**: Total votes + remaining votes does not equal the total amount of possible votes");
    return output;
  }
  
  
  //Identify majority
  if(Math.round((new Date()).getTime()/1000) > Propositions[propositionID].timestamp+72*60*60){
    //The proposition has timed out
    //Identify which majority has been reached
    output.majority = exports.checkMajority(output.upvotes.length, output.downvotes.length, output.leftvotes.length, 0);
  }else{
    //The proposition is still active
    //Check if the proposition has reached a majority of votes
    output.majority = exports.checkMajority(output.upvotes.length, output.downvotes.length, output.leftvotes.length, output.remaining.length);
  }
  
  
  return output;
  
}



/**
 * Given a list of users, return the corresponding player objects, and detect illegal votes
 * @param {Collection<User>} reactionUsers A list of users who reacted to a proposition
 * @param {int} proponentID The PID of the proponent
 * @param {int} propositionID ID of the proposition
 * @returns {Object} An object containing an array of players and a boolean for any illegal votes detected
 */
const getVotePlayers = (reactionUsers, proponentID, propositionID) => {
  
  var output = {
    players: [],
    illegalVote: false
  };
  
  if(reactionUsers == undefined){
    return output;
  }
  
  //Create a list of players who voted
  for(var u = 0;u < reactionUsers.size;u ++){
    
    var playerID = identifyPlayer(reactionUsers.at(u).id);
    
    if(playerID == undefined){
      
      //If the player ID is undefined then a non-player user has voted on the proposition
      
      if(reactionUsers.at(u).id != SecureInfo.botID){
        
        //console.log("Unidentified player vote:",reactionUsers.at(u).username);
        output.illegalVote = true;
        
      }
      
    }else{
      
      if(playerID == proponentID){
        
        //Proponent voted on their own proposition
        
        //console.log("Proponent self-voted:",Players[proponentID].name);
        if(Propositions[propositionID].judgesuggestion){
          output.players.push(Players[playerID]);
        }else{
          output.illegalVote = true;
        }
        
      }else{
        
        //Check if the player is still playing Nomic
        if(Players[playerID].playing){
          
          //Add the player to the output list
          output.players.push(Players[playerID]);
          
          //Check if the player is flagged as inactive
          if(!Players[playerID].active){
            
            if(propositionID+5 >= Propositions.length){
              //If the proposition is one of the most recent 5, make the player active again
              Players[playerID].active = true;
              updateFile("players");
              logMessage("Made "+Players[playerID].name+" active");
            }
            
          }
          
        }else{
          
          //If the player has left the game, check if their vote would have been valid by comparing timestamps
          
          if(Propositions[propositionID].timestamp < Players[playerID].quittimestamp){
            output.players.push(Players[playerID]);
          }else{
            output.illegalVote = true;
          }
          
        }
        
      }
      
    }
    
  }
  
  return output;
  
}



/**
 * Given the amounts of votes on a proposition, return the type of majority reached (if applicable)
 * @param {int} upvotes Amount of upvotes
 * @param {int} downvotes Amount of downvotes
 * @param {int} leftvotes Amount of leftvotes
 * @param {int} remaining Amount of players who have not voted yet
 * @returns {int} Majority indicator:
 * * -1 = Not yet majority
 * * 0 = Tie (Deprecated)
 * * 1 = Upvote majority
 * * 2 = Downvote majority
 * * 3 = Leftvote majority
 */
exports.checkMajority = (upvotes, downvotes, leftvotes, remaining) => {
  
  if(remaining == 0){
    //If there are no votes remaining a majority must be reached
    if(upvotes == downvotes){
      if(leftvotes == 0){
        //TIE
        return 0;
      }else if(leftvotes > 0){
        //LEFT
        return 3;
      }
    }else if(upvotes > downvotes){
      if(leftvotes >= upvotes){
        //LEFT
        return 3;
      }else if(upvotes > leftvotes){
        //UP
        return 1;
      }
    }else if(downvotes > upvotes){
      if(leftvotes + upvotes > downvotes){
        //LEFT
        return 3;
      }else if(downvotes >= leftvotes + upvotes){
        //DOWN
        return 2;
      }
    }
    
  }else{
    //If there are votes remaining a majority may or may not be reached
    if(leftvotes > downvotes + remaining || upvotes > downvotes + remaining){
      //Cannot be downvote majority
      if(leftvotes >= upvotes + remaining){
        //LEFT
        return 3;
      }else if(upvotes > leftvotes + remaining){
        //UP
        return 1;
      }
    }else if(leftvotes > upvotes + remaining || downvotes >= upvotes + remaining){
      //Cannot be upvote majority
      if(leftvotes + upvotes > downvotes + remaining){
        //LEFT
        return 3;
      }else if(downvotes >= leftvotes + upvotes + remaining){
        //DOWN
        return 2;
      }
    }
  }
  
  return -1;
  
}



/**
 * Match a Discord message to a proposition
 * @param {String} messageID The ID of the Discord message containing the proposition
 * @returns {int} The ID of the proposition
 */
exports.matchProposition = (messageID) => {
  
  for(var p = 0;p < Propositions.length;p ++){
      
    if(messageID == Propositions[p].messageID){
      return p;
    }
    
  }
  
  return -1;
  
}



/**
 * Update the active players
 */
exports.updateActivity = () => {
  
  //Start with an array with one element per player
  var active = [];
  for(var p = 0;p < Players.length;p ++){
    active[p] = false;
  }
  
  //Loop through the most recent 5 propositions
  for(var prop = 0;prop < 5;prop ++){
    
    var proposition = Propositions[Propositions.length - prop - 1];
    
    //Make the author of the proposition active
    for(var p = 0;p < Players.length;p ++){
      if(proposition.author == p){
        active[p] = true;
      }
    }
    
    //Loop through the first 3 vote types 
    for(var vt = 0;vt < 3;vt ++){
      
      for(var pl = 0;pl < proposition.votes[vt].length;pl ++){
        active[proposition.votes[vt][pl]] = true;
      }
      
    }
    
  }
  
  //Update the Players object
  for(var p = 0;p < Players.length;p ++){
    
    if(Players[p].active != active[p]){
      logMessage("Made "+Players[p].name+" "+(active[p] ? "" : "in")+"active");
    }
    
    Players[p].active = active[p];
    
  }
  
  updateFile("players");
  
}

