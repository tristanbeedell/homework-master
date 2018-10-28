//discord bot library
const RichEmbed = require('discord.js').RichEmbed;
const discord = require('../modules/discord')
const bot = discord.getBot();
//import all commands I made for the bot
const commandsScript = require('./commands.js');
const commands = commandsScript.commands;
// connect to database
const pool = require('../modules/database').getDB();
const bcrypt = require("bcrypt"); //for pin encryption
const createUser = require('./createUser');

bot.on('guildMemberAdd', createUser.newMember)
bot.on('message', msg => {
	if (msg.author.id == bot.user.id) {
		return;
	} else if (msg.channel.type == "dm") {
		createUser.dmRespond(msg)
	} else if (msg.mentions.users.first() == bot.user) {
		respond(msg)
	}
	if (msg.content == 'yeet') { createUser.newMember(msg.member) }
});

function respond(msg) {
	let mentionLoc = msg.content.indexOf(bot.user.toString())
	let commandWords = msg.content.slice(mentionLoc + 21).split(' ').splice(1)

	command = commands[commandWords[0]];

	if (command) {
		if (command.adminOnly && !msg.member.hasPermission("ADMINISTRATOR")) {
			msg.channel.send(":rolling_eyes: You must be an admin in order to execute this command!")
		} else {
			let reply = command.func(msg);
			msg.channel.send(reply)
		}
	} else {
		msg.channel.send(`:thinking_face: Invalid. Use ${bot.user.toString()} help if you need help.`)
	}
}

function parseMessage(content) {

}
