/**
  Anthony Wilson
  
  Nomic Bot miscellaneous utility functions
**/



"use strict";

const { devmode } = require("./config.json");

const SecureInfo = require("./secureinfo.json");



//Print a message to the console and send a message in the #nas-logs thread
exports.logMessage = async (client, message) => {
  
  console.log(message);
  
  if(!devmode){
    //Send a message to the NAS-Logs thread
    client.channels.cache.get(SecureInfo.channels[6].ID).send(message);
  }
  
}

//Return the matching player ID given the Discord user ID
exports.identifyPlayer = (id) => {
  
  for(var p = 0;p < SecureInfo.players.length;p ++){
    
    if(SecureInfo.players[p].ID == id){
      return SecureInfo.players[p].PID;
    }
    
  }
  
  return undefined;
  
}