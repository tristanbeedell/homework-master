module.exports = { initBot, getBot }

const colors = require('colors');
const Discord = require("discord.js");
const assert = require('assert');
const token = process.env.DISCORD_BOT_SECRET;

let bot;

function initBot(callback) {
	bot = new Discord.Client();
	bot.login(token).catch(console.error);
	bot.on("ready", () => {
		console.warn("connected to discord".yellow);
		callback(bot)
	});
}

function getBot() {
	assert.ok(bot, "bot is not connected".red);
	return bot;
}
