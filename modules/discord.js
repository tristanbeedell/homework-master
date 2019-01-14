module.exports = { initBot, getBot }

const Discord = require("discord.js");
const assert = require('assert');
const token = process.env.DISCORD_BOT_SECRET;

let bot;

function initBot(callback, other) {
	console.time('bot connection time');
	console.log('Connecting to Bot...');
	bot = new Discord.Client();
	bot.login(other || token).catch(console.error);
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
