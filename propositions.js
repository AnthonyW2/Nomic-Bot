/**
 * Proposition functionality module
 * 
 * @author Anthony Wilson
 */



"use strict";

//Filesystem
const fs = require("fs");
const { logMessage } = require("./utils");

var propositions = require(sitePath+"/Propositions/propositions.json");



//Triggered when a player sends a message in #propositions
exports.createProposition = async (message) => {
  
  var upvoteEmoji = message.guild.emojis.cache.get(Config.emoji.upvote);
  var downvoteEmoji = message.guild.emojis.cache.get(Config.emoji.downvote);
  //var upvoteEmoji = "👍";
  //var downvoteEmoji = "👎";
  
  message.react(upvoteEmoji).then(() => {
    message.react(downvoteEmoji);
  });
  
  propositions.push({
    author: 0,
    content: message.content,
    path: "",
    timestamp: message.createdTimestamp,
    messageid: message.id,
    votes: [0,0]
  });
  
  fs.writeFile(
    sitePath+"/Propositions/propositions.json",
    JSON.stringify(propositions, null, 2),
    (error) => {
      if(error){
        console.error("Failed to write to propositions.json",error);
      }
    }
  );
  
  logMessage("New proposition created");
  //console.log("New proposition created");
  
}



//Triggered when a user reacts to a message in #propositions
exports.handleVote = async (reaction) => {
  
  var voteStatus = await exports.getVoteStatus(reaction.message);
  
  //Identify the matching proposition
  var prop = -1;
  for(var p = 0;p < propositions.length;p ++){
    if(reaction.message.id == propositions[p].messageid){
      
      prop = p;
      
    }
  }
  if(prop == -1){
    logMessage("Warning: Vote detected on uncached proposition");
    return;
  }
  
  console.log("Vote detected");
  
  //Only modify propositions if the vote amounts are different
  if(propositions[prop].votes[0] != voteStatus.upvotes.length || propositions[prop].votes[1] != voteStatus.downvotes.length){
    
    propositions[prop].votes[0] = voteStatus.upvotes.length;
    propositions[prop].votes[1] = voteStatus.downvotes.length;
    
    fs.writeFile(
      sitePath+"/Propositions/propositions.json",
      JSON.stringify(propositions, null, 2),
      (error) => {
        if(error){
          console.error("Failed to write to propositions.json",error);
        }
      }
    );
  }else{
    return;
  }
  
  var majorityAnnouncementChannel = client.channels.cache.get(SecureInfo.channels[4].ID);
  
  switch(voteStatus.majority){
    case 0:
      console.log("Proposition has tied!");
      majorityAnnouncementChannel.send("<@"+reaction.message.author.id+">'s proposition has tied, so it has not passed");
      break;
    case 1:
      console.log("Proposition reached upvote majority!");
      majorityAnnouncementChannel.send("<@"+reaction.message.author.id+">'s proposition has passed");
      break;
    case 2:
      console.log("Proposition reached downvote majority!");
      majorityAnnouncementChannel.send("<@"+reaction.message.author.id+">'s proposition has not passed");
  }
  
}

/**
 * Get the vote status of a proposition
 * @param {Message} message The message containing the proposition
 * @returns {Object} A single object "output" containing vote information
 */
exports.getVoteStatus = async (message) => {
  
  /**
   * Returned by this function
   * @property {integer} majority The type of majority (if applicable).
   *   -1 = no majority
   *   0 = tie
   *   1 = upvote majority
   *   2 = downvote majority
   * @property {Player} upvotes Array of players who upvoted
   * @property {Player} downvotes Array of players who downvoted
   * @property {Player} remaining Array of players who are yet to vote
   */
  var output = {
    majority: -1,
    upvotes: [],
    downvotes: [],
    remaining: 0,
    illegalVote: false
  };
  
  var proponent = identifyPlayer(message.author.id);
  
  var upvoteUsers = await message.reactions.cache.get(Config.emoji.upvote).users.fetch();
  var downvoteUsers = await message.reactions.cache.get(Config.emoji.downvote).users.fetch();
  
  //Create a list of players who upvoted
  for(var u = 0;u < upvoteUsers.size;u ++){
    
    var player = identifyPlayer(upvoteUsers.at(u).id);
    
    if(player == undefined){
      
      if(upvoteUsers.at(u).id != SecureInfo.botID){
        
        //console.log("Unidentified player vote:",upvoteUsers.at(u).username);
        output.illegalVote = true;
        
      }
      
    }else{
      
      if(player == proponent){
        
        //console.log("Proponent self-voted:",Players[proponent].name);
        output.illegalVote = true;
        
      }else{
        
        output.upvotes.push(Players[player]);
        
      }
      
    }
    
  }
  
  //Create a list of players who downvoted
  for(var u = 0;u < downvoteUsers.size;u ++){
    
    var player = identifyPlayer(downvoteUsers.at(u).id);
    
    if(player == undefined){
      
      if(downvoteUsers.at(u).id != SecureInfo.botID){
        
        //console.log("Unidentified player vote:",downvoteUsers.at(u).username);
        output.illegalVote = true;
        
      }
      
    }else{
      
      if(player == proponent){
        
        //console.log("Proponent self-voted:",Players[proponent].name);
        output.illegalVote = true;
        
      }else{
        
        output.downvotes.push(Players[player]);
        
      }
      
    }
    
  }
  
  //var upvoteCount = message.reactions.cache.get(Config.emoji.upvote)?.count | 0;
  //var downvoteCount = message.reactions.cache.get(Config.emoji.downvote)?.count | 0;
  
  var totalVotes = output.upvotes.length + output.downvotes.length;
  output.remaining = Players.length - totalVotes - 1;
  //output.remaining = 1;
  
  if(output.remaining == 0 && output.upvotes.length == output.downvotes.length){
    //Tie
    output.majority = 0;
    
  }else if(output.upvotes.length + output.remaining >= output.downvotes.length){
    
    if(output.downvotes.length + output.remaining < output.upvotes.length){
      //Upvote majority
      output.majority = 1;
    }
    
  }else{
    //Downvote majority
    output.majority = 2;
  }
  
  return output;
  
}
