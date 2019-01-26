
const path = require('path');
const send = require(path.join(__dirname, '../send'));
const RichEmbed = require('discord.js').RichEmbed;

module.exports = {
	name: 'poll',
	rule: /^\s*(ma?ke?|create)?(\s*a?\s*)?poll/i,
	usage: 'poll __name__ choices: __choices__', 
	summary: 'Creates a poll',
	instructions: '',
	func: async ({ msg, tokens, dest }) => {
		let reply = new RichEmbed();
		let title = tokens.match(/(poll|titled?:?)\s*`([^`]*)`/i);
		if (title) {
			title = title[2];
			reply.setTitle(title);
		}
		let choices = tokens.match(/choi(c|s)es:?\s*`([^`]*)`(?:, *`([^`]*)`(?:, *`([^`]*)`(?:, *`([^`]*)`(?:, *`([^`]*)`)?)?)?)?/i);
		if (choices) {
			choices = choices.splice(2);
		} else {
			msg.channel.send('ERROR :thinking_face: No choices.');
			return;
		}
		const emojis = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫'];
		let index = 0;
		choices = choices.filter(word => word);
		choices.forEach(choice => {
			reply.addField(choice, emojis[index], true);
			index++;
		});
		let poll = await send(reply, msg, dest);
		for (let i = 0; i < choices.length; i++) {
			await poll.react(emojis[i]);
		}
		poll.pin();
	}
};