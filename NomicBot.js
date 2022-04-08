/**
  Anthony Wilson
  
  2021-8-7 - 2022-4-7
  
  Nomic Discord bot
  
  v3.0.0
**/

//Relevant links:
/// https://discord.js.org/#/docs/discord.js/stable/general/welcome
/// https://discordjs.guide/creating-your-bot/



//Require the Discord.js classes
const { Client, Intents } = require("discord.js");

//Import various configurations/settings
const Config = require("./config.json");

//Import the secure/sensitive information (token, player user IDs, etc)
const SecureInfo = require("./secureinfo.json");

//Import the commands list
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
  
});



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





