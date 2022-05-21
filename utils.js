/**
 * Miscellaneous utility functions
 * 
 * @author Anthony Wilson
 */



"use strict";

//Filesystem
const fs = require("fs");



/**
 * @async
 * Print a message to the console and send a message in the #nas-logs thread in the Nomic guild.
 * @param {string} message
 */
exports.logMessage = async (message) => {
  
  console.log(message);
  
  if(!devmode){
    //Send a message to the NAS-Logs thread
    await client.channels.cache.get(SecureInfo.channels[6].ID).send(message);
  }
  
}



/**
 * @async
 * Return the matching player ID given the Discord user ID
 * @param {string} id A Discord user ID
 * @returns {int} Player ID (PID)
 */
exports.identifyPlayer = (id) => {
  
  for(var p = 0;p < SecureInfo.players.length;p ++){
    
    if(SecureInfo.players[p].ID == id){
      return SecureInfo.players[p].PID;
    }
    
  }
  
  return undefined;
  
}



/**
 * @async
 * Update a JSON file on the website
 * @param {string} file A Discord user ID
 * @returns {boolean} False if @param file does not match a known file to write to
 */
exports.updateFile = (file) => {
  
  var path;
  var content;
  
  switch(file){
    case "propositions":
      path = sitePath+"/Propositions/propositions.json";
      content = JSON.stringify(Propositions, null, 2);
      break;
    
    //case "rules":
    //  path = sitePath+"/Rules/rules.json";
    //  content = JSON.stringify(Rules, null, 2);
    //  break;
    
    case "players":
      path = sitePath+"/Players/players.json";
      content = JSON.stringify(Players, null, 2);
      break;
    
    default:
      return false;
  }
  
  fs.writeFile(
    path,
    content,
    (error) => {
      if(error){
        console.error("Failed to write to "+path, error);
      }
    }
  );
  
  return true;
  
}
