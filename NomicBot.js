/**
  Anthony Wilson
  
  2021-8-7 - 2022-4-7
  
  Nomic Discord bot
  
  v3.0.0
**/

//Relevant links:
/// https://discord.js.org/#/docs/discord.js/v13/general/welcome
/// https://discordjs.guide/creating-your-bot/
/// https://discord.js.org/#/docs/discord.js/v13/class/Client



//Discord.js classes
const { Client, Intents } = require("discord.js");

//Fetch
const fetch = require("node-fetch");
///import fetch from "node-fetch";

//Various configurations/settings
const Config = require("./config.json");

//Secure/sensitive information (token, player user IDs, etc)
const SecureInfo = require("./secureinfo.json");

//Command functions and commands list
const Commands = require("./commands.js");


//Create a new client instance
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
  ],
  partials: ["MESSAGE", "CHANNEL", "REACTION"]
});



//Indicate when the application has successfully connected
client.on("ready", () => {
  
  console.log(`Connected to ${client.user.tag}`);
  
  
  //Set presence
  client.user.setPresence({
    status: "online",
    activities: [
      { type: "PLAYING", name: "Nomic" },
      ///{ type: "WATCHING", name: "your votes" },
      ///{ type: "LISTENING", name: "the void" },
    ]
  });
  
  ///console.log("Set status");
  
  
  //Update the message in #links that links to the website
  updateServerURLMsg();
  
});



updateServerURLMsg = async () => {
  var req = await fetch("http://ifconfig.me/ip");
  var ip = await req.text();
  
  var msg = "Nomic website links\nGithub: https://anthonyw2.github.io/Nomic/\nAnthony's server: http://"+ip+":8084/Nomic";
  
  var linksChannel = client.channels.cache.get(SecureInfo.channels[5].ID);
  
  //Only used once to send the initial message
  ///linksChannel.send(msg);
  
  //Get the message with the server URL in it
  var message = await linksChannel.messages.fetch("962154858981507122");
  
  //Check if the message needs to be updated
  if(message.content != msg){
    
    message.edit(msg);
    
    console.log("Updated server URL message");
    
  }
  
}



//Called when a message is sent in a Guild or DM that Nomic Bot has access to
client.on('messageCreate', async (message) => {
  
  Commands.processMessage(message);
  
});


//Called when a slash command is used in a Guild or DM that Nomic Bot has access to
client.on("interactionCreate", async (interaction) => {
  
  Commands.processInteraction(interaction);
  
});



// Connect to the Discord API and login into the Nomic Bot application
client.login(SecureInfo.token);





