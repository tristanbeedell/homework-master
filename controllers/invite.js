module.exports = { invite }

const path = require('path');
const { getBot } = require(path.join(__dirname, '../modules/discord'));
const { getDB } = require(path.join(__dirname, '../modules/database'));

async function invite(req, res) {
	const bot = getBot();
	const pool = getDB();
	// if uninvited, let the user join
	if (!req.session.invite)
		return res.redirect('/join');

	// get the invite from discord.
	let invite
	try {
		invite = await bot.fetchInvite(req.session.invite.url);
	} catch (error) {
		// invite has expired
		delete req.session.invite;
		res.redirect('/join');
		return;
	}

	// get group data from database
	let group = await pool.query(`
		SELECT 	school_name, invite, year
		FROM groups
		WHERE guild_id = '${invite.guild.id}';
	`).catch(console.error);

	// render the page
	res.render('pages/invite', {
		...req,
		bot: bot,
		invite: invite,
		group: group.rows[0]
	});
}
