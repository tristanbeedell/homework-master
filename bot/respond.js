const path = require('path');
const commands = require(path.join(__dirname, './get_commands'));

function respond({ msg, tokens, dest, selected }) {
	let command;
	for (const i in commands) {
		let rule = commands[i].rule;
		if (tokens && tokens.match(rule)) {
			command = commands[i];
		}
	}
	if (command) {
		if (command.permissions && !msg.member.hasPermission(command.permissions)) {
			msg.react('🛑');
			msg.channel.send(`🛑 You do not have permission to execute ${command.name}!`);
		} else {
			command.func({ msg, tokens, dest, selected });
		}
	} else {
		msg.react('❌');
		const tokenArray = tokens.replace(/^\s*/, '').split(' ');

		msg.channel.send(`❌ The instruction \`${tokenArray[0]}${tokenArray.length > 1 ? ' ... '+tokenArray.slice(-1)[0] : ''}\` was not recognised.`);
	}
}

module.exports = respond;
