module.exports = { initBot, getBot, createEmbed };

const Discord = require('discord.js');
const assert = require('assert');
const token = process.env.DISCORD_BOT_SECRET;

let bot;

function initBot(callback, other) {
	console.log('Connecting to Bot...');
	bot = new Discord.Client();
	bot.login(other || token).catch(console.error);
	bot.on('ready', () => {
		console.warn(`connected to '${bot.user.tag}' on discord`.yellow);
		callback(bot);
	});
}

function getBot() {
	assert.ok(bot, 'bot is not connected'.red);
	return bot;
}

function createEmbed(member) {
	const url = `${process.env.WEBSITE_URL}/guilds/${encodeURIComponent(member.guild.name)}/members/${encodeURIComponent(member.displayName)}`.replace(/%20/g, '_');
	const embed = new Discord.RichEmbed()
		.setAuthor(member.displayName, member.user.avatarURL, url);
	return embed;
}