/**
  Anthony Wilson
  
  Define Nomic Bot slash commands
**/



const { SlashCommandBuilder } = require("@discordjs/builders");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");

//Import the commands list
const Commands = require("./commands.js");

//Import the secure/sensitive information (token, player user IDs, etc)
const SecureInfo = require("./secureinfo.json");

var commands = [];

for(var c = 0;c < Commands.list.length;c ++){
  
  //Build a slash command object using the information from commands.js and add it to the commands array
  commands.push(
    new SlashCommandBuilder().setName( Commands.list[c].name ).setDescription( Commands.list[c].description )
  );
  
}

const rest = new REST({ version: "9" }).setToken(SecureInfo.token);

console.log("Registering application (/) commands...");

rest.put(
  Routes.applicationGuildCommands(SecureInfo.botID, SecureInfo.nomicGuildID), { body: commands.map(command => command.toJSON()) }
)
.then(() => console.log('Successfully registered application (/) commands'))
.catch(console.error);






