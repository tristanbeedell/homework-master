const Discord = require('discord.js');
const { getBot } = require('../modules/discord');
const RichEmbed = Discord.RichEmbed;
const url = require('url');

let commands = [];
const urlname = process.env.WEBSITE_URL;

class Command {
	constructor(rule, name, instructions, func, adminOnly = false) {
		this.rule = rule;
		this.name = name;
		this.instructions = instructions;
		this.func = func;
		this.adminOnly = adminOnly;
		commands.push(this)
	}
}

new Command(/^ *help/i, "`help`", "prints out the commands", ({ msg, dest }) => {
	let reply = new RichEmbed()
		.setTitle(`COMMANDS`)
		.setDescription(`
			Proceed a mention of this bot (@${getBot().user.tag}) with these commands
			Replace all \`<...>\` appropiately
		`);
	// for each command in the commands object
	commands.forEach(command => {
		// do not list admin only commands
		if (!command.adminOnly) {
			// add command to reply in a new line
			reply.addField(command.name, command.instructions);
		}
	})
	if (dest) {
		dest.send(reply)
	} else {
		msg.channel.send(reply)
	}
});

new Command(/^ *(<@\d+> ?'?s?|my) +profile/i, "`<@user> profile`", "returns selected profile", ({ msg, dest, tokens }) => {
	let id = tokens.match(/^ *(<@(\d+)> ?'?s?|my)/)[2]
	let selected = msg.guild.members.get(id)
	member = selected || msg.member
	let profileUrl = `${urlname}/guilds/${msg.guild.name}/members/${member.displayName}`.replace(/ /g, "_");
	let embed;
	embed = new RichEmbed()
		.setTitle(`${member.displayName}'s Profile`)
		.setURL(profileUrl)
		.setAuthor(member.displayName, member.user.avatarURL)
		.setColor(0xFFFFFF)
	if (dest) {
		dest.send(embed)
	} else {
		msg.channel.send(embed)
	}
});

new Command(/^ *(DM|message|send) +<@\d+>/i, "`message`, `DM` or `send <@user> ...`", 'sends the command\'s outcome to `<@user>`', async ({ msg, tokens, selected }) => {
	let id = tokens.match(/<@(\d+)>/)[1]
	let dest = msg.guild.members.get(id)
	let next = tokens.slice(tokens.indexOf('>') + 1)
	respond({ msg, tokens: next, dest, selected })
})

new Command(/^ *report/i, "`report <@user> for <reason>`", ' Reports `<@user>`. This may lead to consequenses', ({ msg, tokens }) => {
	let mention = tokens.match(/<@(\d+)>/)
	if (!mention) {
		msg.channel.send(`:thinking_face: that make sure you properly @ mention a user.`)
		return;
	}
	let id = mention[1]
	let member = msg.guild.members.get(id)
	if (!member) {
		msg.channel.send(`:thinking_face: the member ${mention[1]} does not exist`)
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
	member.send(report)
})

new Command(/^ *(ma?ke?|create)?( *a? *)?poll/i,
	'`make a poll titled: <name> with choices: <name>, <name>, ...`', 'creates a poll max 5 choices',
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
			msg.channel.send('error: no choices');
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
		let poll
		if (msg.editable) {
			poll = await msg.edit(reply)
		} else {
			poll = await send(reply, msg, dest)
		}
		for (let i = 0; i < choices.length; i++){
			await poll.react(emojis[i]);
		}
		poll.pin()
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
	})

new Command(/^ *(say)? *`.*`/, 'say <text>', 'all words to be taken literally must be wrapped in backticks', ({ msg, tokens, dest }) => {
	reply = msg.author + ' says '
	let quote = tokens.match(/`.*`/)
	reply += quote[0]
	if (dest) {
		dest.send(reply)
	} else {
		msg.channel.send(reply)
	}
})

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
		sanctions: 'None yet, but be careful.'
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

module.exports = respond

function send(content, msg, dest) {
	if (dest) {
		return dest.send(content)
	} else {
		return msg.channel.send(content)
	}
}

// TODO: make the whole server setup automated
