
const path = require('path');
const send = require(path.join(__dirname, '../send'));
const RichEmbed = require('discord.js').RichEmbed;

module.exports = {
	name: 'poll',
	rule: /^\s*(ma?ke?|create)?(\s*a?\s*)?poll/i,
	usage: 'poll __name__ choices: __choices__ [ __nopin__ ]', 
	summary: 'Creates a poll',
	instructions: 'Creates a poll that can be voted on in discord using reaction emojis\n\n' +
	'2 to 6 choices may be provided.\n' +
	'Choices are given as follows: `\'choice1\', \'choice2\'[, ...]`\n\n' +
	'Polls will be pinned by default. You can choose for the poll not to be pinned by including __nopin__ in the command',
	func: async ({ msg, tokens, dest }) => {
		const chunk ='[“”‘’‛‟\'"′″´˝`]([^“”‘’‛‟\'"′″´˝`]*)[“”‘’‛‟\'"′″´˝`]';
		let reply = new RichEmbed();
		let title = tokens.match(new RegExp('(poll|titled?:?)\\s*'+chunk));
		if (title) {
			title = title[2];
			reply.setTitle(title);
		} else {
			msg.reply('ERROR :thinking_face: No title. The title is set like: `poll "title"`');
			return;
		}
		let choices = tokens.match(new RegExp(`choi(?:c|s)es:?\\s*${chunk}, *${chunk}(?:, *${chunk}(?:, *${chunk}(?:, *${chunk})?)?)?`));
		if (choices) {
			choices = choices.splice(1);
		} else {
			msg.reply('ERROR :thinking_face: Not enough choices. The choices are set like: `choices: "1", "2"[, ...]`');
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
		if (!tokens.match(/nopin/)) {
			poll.pin();
		}
	}
};