module.exports = { initBot, getBot }

const colors = require('colors');
const Discord = require("discord.js");
const assert = require('assert');
const token = process.env.DISCORD_BOT_SECRET;

let bot;

function initBot(callback, _token) {
	console.time('bot connection time');
	bot = new Discord.Client();
	bot.login(_token || token).catch(console.error);
	bot.on("ready", () => {
		console.warn(`connected to '${bot.user.tag}' on discord`.yellow);
		console.timeEnd('bot connection time');
		callback(bot)
	});
}

function getBot() {
	assert.ok(bot, "bot is not connected".red);
	return bot;
}
