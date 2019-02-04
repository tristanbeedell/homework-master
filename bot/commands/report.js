const path = require('path');
const discord = require(path.join(__dirname, '../../modules/discord'));
const send = require(path.join(__dirname, '../send'));

const swat = {
	'S': {
		'name': 'State',
		'sanctions': ['No sactions yet. Please follow the guidelines.']
	},
	'W': {
		'name': 'Warning',
		'sanctions': ['You cannot boost people"s status with reactions.']
	},
	'A': {
		'name': 'Action',
		'sanctions': [
			'You cannot embed files.',
			'You cannot speak in voice chats.',
			'You cannot trigger push notifications with @everyone.'
		]
	},
	'T': {
		'name': 'Transfer',
		'sanctions': ['You cannot interact with the server.']
	}
};

module.exports = {
	name: 'report',
	rule: /^\s*report/i,
	usage: 'report __@user__ for __reason__',
	summary: 'Reports __@user__.',
	func,
	instructions: 'Mention the user you wan\'t to report. Please give a reason. Abusing this comands will lead to punishments'
};

function func ({ msg, tokens }) {
	let mention = tokens.match(/<@!?(\d+)>/);
	if (!mention) {
		msg.channel.send('ERROR :thinking_face: No user given.');
		return;
	}
	let id = mention[1];
	let member = msg.guild.members.get(id);
	if (!member) {
		msg.channel.send(`ERROR :thinking_face: The member ${mention[1]} does not exist`);
		return;
	}
	let reason = '';
	if (tokens.match(/for +`(.*)`/)) {
		reason = tokens.match(/for +`(.*)`/)[1];
	}
	let severity = '';
	['S', 'W', 'A', 'T'].some((abr) => {
		let abrRole = msg.guild.roles.find(role => role.name === abr);
		if (!member.roles.some(role => role === abrRole)) {
			member.addRole(abrRole);
		}
		severity = abrRole;
		return !member.roles.some(role => role === abrRole);
	});
	let report = discord.createEmbed(msg.member)
		.setTitle('YOU HAVE BEEN REPORTED')
		.addField('REPORTER', msg.author)
		.addField('REASON', reason || 'not given')
		.addField('SEVERITY', swat[severity.name].name)
		.addField('SANCTIONS', swat[severity.name].sanctions)
		.setColor(severity.color)
		.setFooter('Wasn\'t you? Contact the staff.');
	send(report, msg, member);
}