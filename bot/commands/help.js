const path = require('path');
const send = require(path.join(__dirname, '../send'));
const discord = require(path.join(__dirname, '../../modules/discord'));

module.exports = {
	name: 'help',
	rule: /^\s*help/i, 
	func, 
	usage: 'help __[command]__', 
	summary: 'Gets help.',
	instructions: 'Prints out all the commands, or detail on one if provided in __command__.\n\n' +
	'Variables, such as the __command__ in this command are underlined.\n' +
	'Optional phrases or words are wrapped in square brackets `[]`\n'+
	'Where there are multiple choices, they will be separated by bars `|`'
};

let commands;
function func ({ msg, dest, tokens }) {
	commands = require(path.join(__dirname, '../get_commands'));
	let reply;
	let com = tokens.match(/help\s+([^.]+)/);
	if (!com) {
		// get all help
		reply = help(msg.member);
	} else {
		// create an embed for that command given
		reply = instructions(msg.member, com[1]);
	}
	send(reply, msg, dest);
}

function instructions(author, com) {
	let reply;
	const search = commands.filter(command => com.match(command.rule) || com === command.name);

	if (search.length === 0) {
		reply = `I couldn't find a command named ${com}`;
	} else {
		let command = search[0];
		// create an embed
		reply = discord.createEmbed(author) 
			.setTitle(command.usage)
			.setURL(`${process.env.WEBSITE_URL}/help/bot#${command.name}`)
			.setDescription(command.instructions);
	}

	return reply;
}

function help(author) {
	// create an embed
	const reply = discord.createEmbed(author)
		.setTitle('COMMANDS')
		.setURL(`${process.env.WEBSITE_URL}/help/bot`)
		.setDescription(`Send \`@${discord.getBot().user.tag} help <command>\` for help with a command.`);
	// for each command in the commands objectrfrte
	commands.forEach(command => {
		// do not list admin only commands
		if (!command.permissions || (command.permissions && author.hasPermission(command.permissions))) {
			// add command to reply in a new line
			reply.addField(command.name, command.summary, true);
		}
	});

	return reply;
}
