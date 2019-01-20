module.exports = { join }

const path = require('path');
const discord = require(path.join(__dirname, "../modules/discord"))
const database = require(path.join(__dirname, "../modules/database"))
const bcrypt = require('bcrypt')

async function join(req, res) {
	const pool = database.getDB()
	// get the group selected
	groups = await pool.query(`
		SELECT * FROM groups WHERE guild_id = '${req.body.guild}';
	`).catch(console.error);
	if (groups.rowCount === 0) {
		res.render('pages/join', {
			session: req.session,
			bot: discord.getBot(),
			query: req.query,
			wrong: 'guild'
		});
		return;
	}
	const group = groups.rows[0];
	valid = await bcrypt.compare(req.body.pin, group.pin_hash);
	if (!valid) {
		res.render('pages/join', {
			session: req.session,
			bot: discord.getBot(),
			query: req.query,
			wrong: 'pin'
		});
		return;
	}
	const invite = await createInvite(group)
	req.session.invite = { url: invite.url };
	req.session.guild = {
		name: invite.guild.name
	}
	res.redirect('/invite');
}

async function createInvite(group) {
	bot = discord.getBot()
	const guild = bot.guilds.get(group.guild_id)
	const inviteChannel = guild.channels.get(group.invite_channel_id)
	return inviteChannel.createInvite({ maxAge: 300, maxUses: 1 })
}
