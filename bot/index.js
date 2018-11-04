//discord bot library
const RichEmbed = require('discord.js').RichEmbed;
const discord = require('../modules/discord')
const bot = discord.getBot();
//import all commands I made for the bot
const respond = require('./commands.js');
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
	} else if (msg.mentions.users.some((mem) => mem == bot.user)) {
		let mentionLoc = msg.content.indexOf(bot.user.toString())
		let tokens = msg.content.slice(mentionLoc + bot.user.toString().length).slice(2)

		respond({ msg, tokens })
	}
});
