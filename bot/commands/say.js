const path = require('path');
const send = require(path.join(__dirname, '../send'));
const discord = require(path.join(__dirname, '../../modules/discord'));

module.exports = {
	name: 'say',
	rule: /^\s*say/, 
	usage: 'say __text__', 
	summary: 'Echo some text', 
	func: ({ msg, tokens, dest }) => {
		let quote = tokens.match(/^\s*say\s*`([^`]*)`/);
		if (quote) {
			const reply = discord.createEmbed(msg.member)
				.setDescription(quote[1]);
			send(reply, msg, dest);
		} else {
			msg.react('😶');
			msg.channel.send(':thinking_face: Nothing to say...');
		}
	}, 
	instructions: 'This will echo back whatever text is put after. The text must be wrapped in ` backticks'
};
