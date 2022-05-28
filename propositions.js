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
  
  //Add the proposition to the list
  Propositions.push({
    author: proponent,
    content: message.content,
    path: "",
    timestamp: message.createdTimestamp,
    messageID: message.id,
    votes: [0,0,0,0],
    majority: false
  });
  
  //Update propositions.json
  updateFile("propositions");
  
  logMessage("New proposition created");
  
  await client.channels.cache.get(SecureInfo.channels[2].ID).send("<@&977412127121879100> "+Players[proponent].name+" has made a proposition.\n"+message.url);
  
}



/**
 * @async
 * Update the votes on a proposition. Make an announcement if it reaches a majority.
 * Called when a user reacts to a message in #propositions.
 * @param {ReactionManager} reaction The message containing the proposition
 */
exports.handleVote = async (reaction) => {
  
  var voteStatus = await exports.getVoteStatus(reaction.message);
  
  //Identify the matching proposition
  var prop = -1;
  for(var p = 0;p < Propositions.length;p ++){
    
    if(reaction.message.id == Propositions[p].messageID){
      prop = p;
    }
    
  }
  if(prop == -1){
    logMessage("**Warning**: Vote detected on uncached proposition");
    return;
  }
  
  console.log("Vote detected");
  
  //Only announce a majority if it has not already been announced
  if(!Propositions[prop].majority){
    
    var majorityAnnouncementChannel = client.channels.cache.get(SecureInfo.channels[2].ID);
    
    switch(voteStatus.majority){
      case 0:
        console.log("Proposition has tied");
        majorityAnnouncementChannel.send("<@"+reaction.message.author.id+">'s proposition has tied, so it has not passed.\n"+reaction.message.url);
        Propositions[prop].majority = true;
        break;
      case 1:
        console.log("Proposition reached upvote majority");
        majorityAnnouncementChannel.send("<@"+reaction.message.author.id+">'s proposition has passed, and must be added to the rule tree.\n"+reaction.message.url);
        Propositions[prop].majority = true;
        break;
      case 2:
        console.log("Proposition reached downvote majority");
        majorityAnnouncementChannel.send("<@"+reaction.message.author.id+">'s proposition has reached downvote majority, so it has not passed.\n"+reaction.message.url);
        Propositions[prop].majority = true;
        break;
      case 3:
        console.log("Proposition reached leftvote majority");
        majorityAnnouncementChannel.send("<@"+reaction.message.author.id+">'s proposition has reached leftvote majority, and must be re-proposed within 72 hours.\n"+reaction.message.url);
        Propositions[prop].majority = true;
    }
    
  }
  
  //Only modify Propositions if the vote amounts are different
  if(
    Propositions[prop].votes[0] != voteStatus.upvotes.length ||
    Propositions[prop].votes[1] != voteStatus.downvotes.length ||
    Propositions[prop].votes[2] != voteStatus.leftvotes.length ||
    Propositions[prop].votes[3] != voteStatus.rightvotes.length
  ){
    
    Propositions[prop].votes[0] = voteStatus.upvotes.length;
    Propositions[prop].votes[1] = voteStatus.downvotes.length;
    Propositions[prop].votes[2] = voteStatus.leftvotes.length;
    Propositions[prop].votes[3] = voteStatus.rightvotes.length;
    
    updateFile("propositions");
    
  }
  
}



/**
 * @async
 * Get the vote status of a proposition.
 * @param {Message} message The message containing the proposition
 * @returns {Object} A single object "output" containing vote information
 */
exports.getVoteStatus = async (message) => {
  
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
  var upvotePlayers = getVotePlayers(upvoteUsers, proponent);
  output.upvotes = upvotePlayers.players;
  
  //Get the players who downvoted
  var downvoteUsers = await message.reactions.cache.get(Config.emoji.downvote)?.users.fetch();
  var downvotePlayers = getVotePlayers(downvoteUsers, proponent);
  output.downvotes = downvotePlayers.players;
  
  //Get the players who leftvoted
  var leftvoteUsers = await message.reactions.cache.get(Config.emoji.leftvote)?.users.fetch();
  var leftvotePlayers = getVotePlayers(leftvoteUsers, proponent);
  output.leftvotes = leftvotePlayers.players;
  
  //Get the players who rightvoted
  var rightvoteUsers = await message.reactions.cache.get(Config.emoji.rightvote)?.users.fetch();
  var rightvotePlayers = getVotePlayers(rightvoteUsers, proponent);
  output.rightvotes = rightvotePlayers.players;
  
  //Detect any illegal votes
  output.illegalVote = (upvotePlayers.illegalVote || downvotePlayers.illegalVote || leftvotePlayers.illegalVote || rightvotePlayers.illegalVote);
  
  
  //Count how many times each player voted
  var votedPlayers = [];
  for(var p = 0;p < Players.length;p ++){
    votedPlayers.push(0);
  }
  for(var p = 0;p < output.upvotes.length;p ++){
    votedPlayers[output.upvotes[p].PID] ++;
  }
  for(var p = 0;p < output.downvotes.length;p ++){
    votedPlayers[output.downvotes[p].PID] ++;
  }
  for(var p = 0;p < output.leftvotes.length;p ++){
    votedPlayers[output.leftvotes[p].PID] ++;
  }
  for(var p = 0;p < output.rightvotes.length;p ++){
    votedPlayers[output.rightvotes[p].PID] ++;
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
  
  
  ///The .count property could be used to validate the results from the code above
  //var upvoteCount = message.reactions.cache.get(Config.emoji.upvote)?.count | 0;
  //var downvoteCount = message.reactions.cache.get(Config.emoji.downvote)?.count | 0;
  
  
  //Sanity check
  var totalVotes = output.upvotes.length + output.downvotes.length + output.leftvotes.length + output.rightvotes.length;
  if(totalVotes + output.remaining.length != Players.length-1){
    logMessage("**Warning**: Total votes + remaining votes does not equal the total amount of possible votes");
    return output;
  }
  
  
  output.majority = exports.checkMajority(output.upvotes.length, output.downvotes.length, output.leftvotes.length, output.remaining.length);
  
  
  return output;
  
}



/**
 * Given a list of users, return the corresponding player objects, and detect illegal votes
 * @param {Collection<User>} reactionUsers A list of users who reacted to a proposition
 * @param {int} proponentID The PID of the proponent
 * @returns {Object} An object containing an array of players and a boolean for any illegal votes detected
 */
const getVotePlayers = (reactionUsers, proponentID) => {
  
  var output = {
    players: [],
    illegalVote: false
  };
  
  if(reactionUsers == undefined){
    return output;
  }
  
  //Create a list of players who upvoted
  for(var u = 0;u < reactionUsers.size;u ++){
    
    var playerID = identifyPlayer(reactionUsers.at(u).id);
    
    if(playerID == undefined){
      
      if(reactionUsers.at(u).id != SecureInfo.botID){
        
        //console.log("Unidentified player vote:",reactionUsers.at(u).username);
        output.illegalVote = true;
        
      }
      
    }else{
      
      if(playerID == proponentID){
        
        //console.log("Proponent self-voted:",Players[proponentID].name);
        output.illegalVote = true;
        
      }else{
        
        output.players.push(Players[playerID]);
        
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
 * * 0 = Tie
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
    }else if(leftvotes > upvotes + remaining || downvotes > upvotes + remaining){
      //Cannot be upvote majority
      if(leftvotes + upvotes > downvotes + remaining){
        //LEFT
        return 3;
      }else if(downvotes > leftvotes + upvotes + remaining){
        //DOWN
        return 2;
      }
    }
  }
  
  return -1;
  
}
