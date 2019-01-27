
const path = require('path');

module.exports = {
	rule: /^\s*(DM|message|send)\s+(<[@#]!?\d+>|me)/i,
	usage: '(message|DM|send) __(@user|#channel)__ __command__',
	summary: 'Redirect a message',
	func: async ({ msg, tokens, selected }) => {
		let id = tokens.match(/<(@!?|#)(\d+)>/)[2];
		let dest = msg.guild.members.get(id) || msg.guild.channels.get(id);
		let next = tokens.slice(tokens.indexOf('>') + 1);
		require(path.join(__dirname, '../respond'))({ msg, tokens: next, dest, selected });
	},
	name: 'send',
	instructions: 'Mention a user or a channel and have a message redirected to that place.'
};