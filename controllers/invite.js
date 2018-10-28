module.exports = { invite }

const { getBot } = require('../modules/discord')
const { getDB } = require('../modules/database')
let bot;
let pool;

async function invite(req, res) {
	bot = getBot()
	pool = getDB()
	// if uninvited, let the user join
	if (!req.session.invite) {
		res.redirect('/join')
		return;
	}
	// get the invite from discord.
	let invite
	try {
		invite = await bot.fetchInvite(req.session.invite.url);
	} catch (error) {
		// invite has expired
		delete req.session.invite;
		res.redirect('/join')
		return;
	}
	// get group data from database
	let group = await pool.query(`
    SELECT 	school_name, invite, year
  	FROM groups
  	WHERE guild_id = '${invite.guild.id}';
  `)
		.catch(console.error)
	// render the page
	res.render('pages/invite', {
		session: req.session,
		bot: bot,
		invite: invite,
		group: group.rows[0],
	});
}
