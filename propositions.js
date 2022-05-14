/**
 * Proposition functionality module
 * 
 * @author Anthony Wilson
 */



"use strict";

//Discord.js classes
///const { Message } = require("discord.js");

//Filesystem
const fs = require("fs");

//Import various configurations/settings
const Config = require("./config.json");
const cmdpref = Config.prefix;
const sitePath = Config.sitePath;

//Import the secure/sensitive information (token, player user IDs, etc)
const SecureInfo = require("./secureinfo.json");

//Import miscellaneous utility functions
const { logMessage, identifyPlayer } = require("./utils.js");

//Rule class
const { Rule } = require(sitePath+"/Rules/rule-class.js");

//Rule tree and player info list
const Rules = new Rule( require(sitePath+"/Rules/rules.json") );
const Players = require(sitePath+"/Players/players.json");

//List of all previous propositions
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
  
  var newPropositionsFileContents = JSON.stringify(propositions, null, 2);
  
  //console.log(newPropositionsFileContents);
  
  fs.writeFile(
    sitePath+"/Propositions/propositions.json",
    JSON.stringify(propositions, null, 2),
    (error) => {
      if(error){
        console.error("Failed to write to propositions.json",error);
      }
    }
  );
  
  logMessage(message.client, "New proposition created");
  //console.log("New proposition created");
  
}



//Triggered when a user reacts to a message in #propositions
exports.handleVote = async (reaction) => {
  
  //console.log("User reacted to a message in #propositions");
  
  //console.log("Reactions:",reaction.message.reactions);
  //console.log("Reaction cache:",reaction.message.reactions.cache);
  
  var voteStatus = exports.getVoteStatus(reaction.message);
  
  //console.log("Vote status:",voteStatus);
  
  switch(voteStatus.majority){
    case 0:
      console.log("Proposition has tied!");
      break;
    case 1:
      console.log("Proposition reached upvote majority!");
      break;
    case 2:
      console.log("Proposition reached downvote majority!");
  }
  
  /// -- BELOW CODE IS TEMPORARY --
  
  var prop = -1;
  
  for(var p = 0;p < propositions.length;p ++){
    if(reaction.message.content == propositions[p].content){
      
      prop = p;
      
    }
  }
  
  if(prop == -1){
    return;
  }
  
  //Only modify propositions if the vote amounts are different
  if(propositions[prop].votes[0] != voteStatus.upvotes.length || propositions[prop].votes[1] != voteStatus.downvotes.length){
    
    console.log("Vote detected");
    
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
  }
  
}

/**
 * Used by @function exports.handleVote() to get the vote status of a proposition
 * @param {Message} message The message containing the proposition
 * @returns {Object} A single object "output" containing vote information
 */
exports.getVoteStatus = (message) => {
  
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
    remaining: []
  };
  
  var upvoteCount = message.reactions.cache.get(Config.emoji.upvote)?.count | 0;
  var downvoteCount = message.reactions.cache.get(Config.emoji.downvote)?.count | 0;
  
  //console.log("Upvotes:",upvoteCount);
  //console.log("Downvotes:",downvoteCount);
  
  var totalVotes = upvoteCount + downvoteCount - 2;
  var remainingVotes = Players.length - totalVotes - 1;
  
  /// -- BELOW CODE IS TEMPORARY --
  
  for(var a = 0;a < upvoteCount-1;a ++){output.upvotes.push(0);}
  for(var a = 0;a < downvoteCount-1;a ++){output.downvotes.push(0);}
  
  if(remainingVotes == 0 && upvoteCount == downvoteCount){
    
    //Tie
    output.majority = 0;
    
  }
  
  if(upvoteCount + remainingVotes >= downvoteCount){
    
    if(downvoteCount + remainingVotes >= upvoteCount){
      
      //Not yet majority
      
    }else{
      
      //Upvote majority
      output.majority = 1;
      
    }
    
  }else{
    
    //Downvote majority
    output.majority = 2;
    
  }
  
  return output;
  
}
