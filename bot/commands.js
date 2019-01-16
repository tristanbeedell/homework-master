const Discord = require('discord.js');
const path = require('path');
const { getBot } = require(path.join(__dirname, '../modules/discord'));
const RichEmbed = Discord.RichEmbed;

let commands = [];
const urlname = process.env.WEBSITE_URL;

class Command {
	constructor(rule, text, instructions, func, name, adminOnly = false) {
		this.rule = rule;
		this.text = text;
		this.name = name;
		this.instructions = instructions;
		this.func = func;
		this.adminOnly = adminOnly;
		commands.push(this)
	}
}

new Command(/^\s*help/i, "help __command__", "prints out the commands", ({ msg, dest, tokens }) => {
	let reply;
	let com = tokens.match(/help\s+([^.]+)/);
	if (!com) {
		// get all help
		reply = help();
	} else {
		// create an embed for that command given
		reply = instructions(com[1]);
	}
	send(reply, msg, dest);
}, 'help');

function instructions (com) {
	let reply;
	search = commands.filter(command => com.match(command.rule) || com == command.name);

	if (search.length == 0) {
		reply = `Couldn\'t find command ${com}`
	} else if (search.length == 1) {
		let command = search[0];
		reply = new RichEmbed()
			.setTitle(command.text)
			.setURL(`${urlname}/help/bot#${command.name}`)
			.setDescription(command.instructions);
	} else {
		reply = new RichEmbed()
			.setTitle('COMMANDS')
			.setDescription(search.length);
		// for each command in the commands object
		search.forEach(command => {
			// add command to reply in a new line
			reply.addField(command.text, command.instructions);
		})
	}

	return reply;
}

function help() {
	// create an embed
	let reply = new RichEmbed()
		.setTitle(`COMMANDS`)
		.setDescription(`
			To use this bot, follow a ping (\`@${getBot().user.tag}\`) with a command, or DM the bot a command.
			For more detail, use help __command__.
		`)
		.setFooter(`${urlname}/help/bot`);
	// for each command in the commands object
	commands.forEach(command => {
		// do not list admin only commands
		if (!command.adminOnly) {
			// add command to reply in a new line
			reply.addField(command.name, command.instructions);
		}
	})

	return reply;
}

new Command(/^\s*(get\s*)?((<@!?\d+> ?'?s?|my)\s+)?profile\s*((<@!?\d+>|me)\s+)?/i, "__@user__ profile", "returns selected profile", ({ msg, dest, tokens }) => {
	let id = tokens.match(/(<@!?(\d+)> ?'?s?|my)/)[2];
	let selected = msg.guild.members.get(id)
	member = selected || msg.member;
	let profileUrl = `${urlname}/guilds/${msg.guild.name}/members/${member.displayName}`.replace(/ /g, "_");
	let embed;
	embed = new RichEmbed()
		.setTitle(`${member.displayName}'s Profile`)
		.setURL(profileUrl)
		.setAuthor(member.displayName, member.user.avatarURL)
		.setColor(0xFFFFFF)
	send(embed, msg, dest);
}, 'profile');

new Command(/^\s*(DM|message|send)\s+(<[@#]!?\d+>|me)/i, "(message|DM|send) (__@user__|__#channel__) __command__", 'sends the command\'s outcome to __@user__', async ({ msg, tokens, selected }) => {
	let id = tokens.match(/<(@!?|#)(\d+)>/)[2];
	let dest = msg.guild.members.get(id) || msg.guild.channels.get(id);
	let next = tokens.slice(tokens.indexOf('>') + 1);
	respond({ msg, tokens: next, dest, selected });
}, 'send')

new Command(/^\s*report/i, "report __@user__ for __reason__", ' Reports __@user__. This may lead to consequenses', ({ msg, tokens }) => {
	let mention = tokens.match(/<@!?(\d+)>/)
	if (!mention) {
		msg.channel.send(`ERROR :thinking_face: No user given.`)
		return;
	}
	let id = mention[1]
	let member = msg.guild.members.get(id)
	if (!member) {
		msg.channel.send(`ERROR :thinking_face: The member ${mention[1]} does not exist`)
		return;
	}
	let reason = '';
	if (tokens.match(/for +`(.*)`/)) {
		reason = tokens.match(/for +`(.*)`/)[1]
	}
	let severity = '';
	['S', 'W', 'A', 'T'].some((abr) => {
		let abrRole = msg.guild.roles.find(role => role.name == abr);
		if (!member.roles.some(role => role == abrRole)) {
			member.addRole(abrRole)
		}
		severity = abrRole;
		return !member.roles.some(role => role == abrRole)
	})
	let report = new RichEmbed()
		.setTitle(`YOU HAVE BEEN REPORTED`)
		.addField("REPORTER", msg.author)
		.addField("REASON", reason || 'not given')
		.addField("SEVERITY", swat[severity.name].name)
		.addField("SANCTIONS", swat[severity.name].sanctions)
		.setColor(severity.color)
		.setFooter('Wasn\'t you? Contact the staff.')
	send(report, msg, member)
}, 'report')

new Command(/^\s*(ma?ke?|create)?(\s*a?\s*)?poll/i,
	'make a poll titled: __name__ choices: __choices__ time: __time__', 'creates a poll max 6 choices',
	async ({ msg, tokens, dest }) => {
		let reply = new RichEmbed()
		let title = tokens.match(/(poll|titled?:?)\s*`([^`]*)`/i)
		if (title) {
			title = title[2];
			reply.setTitle(title)
		}
		let choices = tokens.match(/choi(c|s)es:?\s*`([^`]*)`(?:, *`([^`]*)`(?:, *`([^`]*)`(?:, *`([^`]*)`(?:, *`([^`]*)`)?)?)?)?/i)
		if (choices) {
			choices = choices.splice(2)
		} else {
			msg.channel.send('ERROR :thinking_face: No choices.');
			return
		}
		const emojis = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫'];
		index = 0;
		choices = choices.filter(word => word);
		choices.forEach(choice => {
			reply.addField(choice, emojis[index], true)
			index++;
		})

		let time;
		if (!tokens.match(/time:?/i)) {
			time = 10000 // 10 seconds
		} else {
			let timeStr = tokens.match(/time:?\s*(`([^`]\d*)(s|m)`)/i)
			if (timeStr) { time = parseInt(timeStr[2]) * (timeStr[3] == 's' ? 1000 : timeStr[3] == 'm' ? 60000 : 0) }
			if (!time || time < 1000) {
				msg.channel.send('Invalid time');
				return;
			}
			reply.setDescription(timeStr[1])
		}
		let poll = await send(reply, msg, dest)
		for (let i = 0; i < choices.length; i++) {
			await poll.react(emojis[i]);
		}
		poll.pin();
		setTimeout(() => {
			poll.delete()
			let embed = poll.embeds[0]
			let outcome = new RichEmbed()
				.setTitle(`poll \`${embed.title}\` ended`)
			embed.fields.forEach(field => {
				reaction = poll.reactions.find(react => react.emoji == field.value)
				if (reaction) {
					votes = reaction.count-1
				} else {
					votes = 0;
				}
				outcome.addField(`\`${field.name}\` got ${votes} votes`, '\u200B')
			})
			poll.channel.send(outcome)
		}, time)
}, 'poll')

new Command(/^\s*(say)? *`.*`/, 'say __text__', 'say some text', ({ msg, tokens, dest }) => {
	reply = msg.author + ' says ';
	let quote = tokens.match(/`[^`]*`/);
	reply += quote[0];
	send(reply, msg, dest);
}, 'say')

function respond({ msg, tokens, dest, selected }) {
	let command
	for (i in commands) {
		let rule = commands[i].rule
		if (tokens && tokens.match(rule)) {
			command = commands[i];
		}
	}
	if (command) {
		if (command.adminOnly && !msg.member.hasPermission("ADMINISTRATOR")) {
			msg.channel.send(":rolling_eyes: You must be an admin in order to execute this command!")
		} else {
			command.func({ msg, tokens, dest, selected })
		}
	} else {
		msg.channel.send(`No instruction was found in: \`${tokens}\``)
	}
}

let swat = {
	'S': {
		name: 'State',
		sanctions: 'No sactions yet. Please follow the guidelines.'
	},
	'W': {
		name: 'Warning',
		sanctions: 'You cannot boost people\'s status with reactions.'
	},
	'A': {
		name: 'Action',
		sanctions: `You cannot embed files.
		You cannot speak in voice chats.
		You cannot trigger push notifications with @everyone.`
	},
	'T': {
		name: 'Transfer',
		sanctions: 'You cannot interact with the server.'
	}
}

module.exports = respond;

function send(content, msg, dest) {
	return new Promise((resolve, reject) => {
		if (dest) {
			return dest.send(content).then((message) => {
				msg.react('✅');
				resolve(message)
			})
		} else {
			resolve(msg.channel.send(content))
		}
	})
}

// TODO: make the whole server setup automated
