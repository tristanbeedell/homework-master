const path = require('path');
const discord = require(path.join(__dirname, '../../modules/discord'));
const database = require(path.join(__dirname, '../../modules/database'));
const send = require(path.join(__dirname, '../send'));

module.exports = {
	name: 'profile',
	rule: /^\s*profile/i, 
	usage: 'profile (__username__|__usertag__|__@user__|__me__)', 
	summary: 'Gets a profile', 
	func: profile, 
	instructions: 'The user\'s profile is printed with a link to the website.\n' +
	`A user can be found by a mention [__${discord.getBot().user.toString()}__], their discord tag [__${discord.getBot().user.tag}__], their discord username [__${discord.getBot().user.username}__] or get your own with [__me__].`
};

async function profile ({ msg, dest, tokens }) {
	if (!msg.guild) {
		send('Please ask for profiles from inside the server.', msg, dest);
		return;
	}
	const match = tokens.match(/^\s*(?:profile)?\s*(\b.+)/i);
	if (!match) {
		msg.reply('You did not specify a user. Use `help profile` for help');
		msg.react('❌');
		return;
	}
	const selected = match[1] === 'my' || match[1] === 'me' ? msg.member
		: msg.guild.members.find(member => 
			member.user.tag === match[1] || 
			member.toString() === match[1] || 
			member.displayName === match[1]
		);

	if (!selected) {
		msg.reply('The user was not found. Use `help profile` for help');
		msg.react('❌');
		return;
	}
	const pool = database.getDB();
	const DBbio = (await pool.query(`SELECT bio FROM users WHERE id = user_id('${selected.id}', '${selected.guild.id}');`));
	let bio = DBbio.rowCount === 1 ? DBbio.rows[0].bio || '' : 'No account yet';
	while (bio.match(/(?:#)+([^\n]+)/)) {
		bio = bio.replace(/(?:#)+([^\n]+)/g, '**$1**');
	}
	const embed = discord.createEmbed(msg.author)
		.setAuthor(selected.displayName, selected.user.avatarURL, `${process.env.WEBSITE_URL}/guilds/${encodeURIComponent(selected.guild.name).replace(/%20/g, '_')}/members/${encodeURIComponent(selected.displayName).replace(/%20/g, '_')}`)
		.setColor(0xFFFFFF)
		.setDescription(bio);
	send(embed, msg, dest);
}
