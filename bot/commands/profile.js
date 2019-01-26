const path = require('path');
const discord = require(path.join(__dirname, '../../modules/discord'));
const database = require(path.join(__dirname, '../../modules/database'));
const send = require(path.join(__dirname, '../send'));

module.exports = {
	name: 'profile',
	rule: /^\s*(get\s*)?((<@!?\d+> ?'?s?|my)\s+)?profile\s*((<@!?\d+>|me)\s+)?/i, 
	usage: '__@user__ profile', 
	summary: 'Gets a profile', 
	func: profile, 
	instructions: 'Mention a user and their profile will be printed out, with a link to the website.'
};

async function profile ({ msg, dest, tokens }) {
	if (!msg.guild) {
		send('Please ask for profiles from inside the server.', msg, dest);
		return;
	}
	const match = tokens.match(/(?:<@!?(\d+)> ?'?s?|my)/);
	const selected = match === 'my' ? msg.member : msg.guild.members.get(match[1]);
	const pool = database.getDB();
	const DBbio = (await pool.query(`SELECT bio FROM users WHERE id = user_id('${selected.id}', '${selected.guild.id}');`));
	const bio = DBbio.rowCount === 1 ? DBbio.rows[0].bio || '' : '';
	const embed = discord.createEmbed(msg.author)
		.setTitle(`${selected.displayName+(selected.displayName.slice(-1)==='s'?'\'':'\'s')} Profile`)
		.setColor(0xFFFFFF)
		.setDescription(bio.replace(/(?:#)+([^\n]+)/, '**$1**'));
	send(embed, msg, dest);
}
