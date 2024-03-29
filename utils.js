/**
 * Miscellaneous utility functions
 * 
 * @author Anthony Wilson
 */



"use strict";

//Filesystem
const fs = require("fs");

//Crypto
const webcrypto = require("crypto").webcrypto;



/**
 * Generate a random number between 0 (inclusive) and 1 (exclusive)
 * This function serves as an unpredictable version of Math.random()
 * @returns {float}
 */
exports.rand = () => {
  
  //Use the crypto API to generate a random 32 bit unsigned integer
  //Divide the integer by 2^32 to get a random number between 0 and 1
  
  return webcrypto.getRandomValues(new Uint32Array(1))[0] / 0x100000000; //0x100000000 = 2^32 = 4294967296
  
}



/**
 * @async
 * Print a message to the console and send a message in the #nas-logs thread in the Nomic guild.
 * @param {string} message
 */
exports.logMessage = async (message) => {
  
  console.log("["+(new Date()).getTime()+"]",message);
  
  if(!devmode){
    //Unarchive the NAS-Logs thread if necessary
    client.channels.cache.get(SecureInfo.channels[6].ID).setArchived(false);
    
    //Send a message to the NAS-Logs thread
    await client.channels.cache.get(SecureInfo.channels[6].ID).send(message);
  }
  
}



/**
 * Return the matching player ID given one of: the player ID; the Discord user ID; the player name.
 * @param {string} id A Discord user ID
 * @returns {int} Player ID (PID)
 */
exports.identifyPlayer = (id) => {
  
  if(id == undefined){
    return undefined;
  }
  
  var type = 2;
  if(isNaN(id)){
    //Player name
    type = 2;
  }else if(id.length <= 3){
    //Player ID
    type = 0;
  }else{
    //User ID
    type = 1;
  }
  
  if(type == 1){
    
    for(var p = 0;p < SecureInfo.players.length;p ++){
      if(SecureInfo.players[p].ID == id){
        return SecureInfo.players[p].PID;
      }
    }
    
  }else{
    
    for(var p = 0;p < Players.length;p ++){
    
      switch(type){
        case 0:
          if(p == id){
            return p;
          }
        break;
        case 2:
          if(id.toLowerCase().includes(Players[p].name.toLowerCase())){
            return p;
          }
        break;
      }
      
    }
    
  }
  
  return undefined;
  
}



/**
 * @async
 * Return the matching Discord User given their ID.
 * @param {string} id A Discord user ID
 * @returns {int} Player ID (PID)
 */
exports.getUser = async (id) => {
  
  var user;
  
  try{
    user = await client.users.fetch(id);
  }catch(error){
    console.error("Failed to find user.", error);
  }
  
  //Report an error if the user was not found
  if(typeof(user) != "object"){
    return undefined;
  }
  
  return user;
  
}



/**
 * Decode arbitrary data from a vault string.
 * @param {string} encString String of encoded data.
 * @returns {Object} Decoded data.
 */
exports.decodeVaultData = (encString) => {
  
  return JSON.parse( Buffer.from(encString, "base64").toString("utf8") );
  
}



/**
 * Encode arbitrary data to be stored in a vault string.
 * @param {Object} data Data to be encoded (must be JSON-compatible).
 * @returns {string} Encoded data.
 */
exports.encodeVaultData = (data) => {
  
  return Buffer.from(JSON.stringify(data), "utf8").toString("base64");
  
}



/**
 * Return the matching attributes of an array of objects
 * @param {array} list An array of objects
 * @param {string} attr A string specifying the name of the attribute
 * @returns {array} An array of attributes of the input object
 */
exports.getAttrList = (list, attr) => {
  
  var output = [];
  
  for(var a = 0;a < list.length;a ++){
    
    output.push(list[a][attr]);
    
  }
  
  return output;
  
}



/**
 * Update a JSON file in the automation system (only specifically allows files work).
 * @param {string} file A Discord user ID.
 * @param {Object} data Optional data to be stored in the specified file.
 * @returns {boolean} False if @param file does not match a known file to write to.
 */
exports.updateFile = (file, data) => {
  
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
    
    case "localstorage":
      path = "./localstorage.json";
      content = JSON.stringify(data, null, 2);
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
