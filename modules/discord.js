module.exports = { initBot, getBot, createEmbed, toHTML };

const Discord = require('discord.js');
const assert = require('assert');
const markdown = require('markdown').markdown;
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
	if (member && member.guild){
		const url = `${process.env.WEBSITE_URL}/guilds/${encodeURIComponent(member.guild.name)}/members/${encodeURIComponent(member.displayName)}`.replace(/%20/g, '_');
		return new Discord.RichEmbed()
			.setAuthor(member.displayName, member.user.avatarURL, url);
	} else {
		return new Discord.RichEmbed();
	}
}

async function toHTML(msg) {
	let html = markdown.toHTML(msg);
	let id = true;
	while (id) {
		id = html.match(/&lt;@(.?)(\d{18})&gt;/);
		if (!id) {
			return html;
		}
		switch (id[1]) {
			case '':
			case '!':
				html = html.replace(/&lt;@.?(\d{18})&gt;/, `<span class="mention">@${(await getBot().fetchUser(id[2])).username.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>`);
				break;
			default:
				html = html.replace(/&lt;@.?(\d{18})&gt;/, `<span class="mention">${markdown.toHTML(id[2])}</span>`);
		}
	}
}
