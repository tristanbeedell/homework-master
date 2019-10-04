module.exports = { get, post };

const path = require('path');
const url = require('url');
const { getBot } = require(path.join(__dirname, "../modules/discord"));
const members = require(path.join(__dirname, "../modules/member"));
const { getDB } = require(path.join(__dirname, "../modules/database"));
const bcrypt = require('bcrypt');

async function get(req, res) {
	const bot = getBot();
	// render page
	res.render("pages/create_server", {
		bot,
		...req
	});
}

async function post(req, res) {
	const bot = getBot();
	let invite = await bot.fetchInvite(req.body.invite)
		.catch(()=>{return});
	if (!invite) {
		res.redirect('/create_guild/create_server?error=invalid_invite');
		return;
	}
	if (!invite.guild.available) {
		res.redirect('/create_guild/create_server?error=wrong_server');
		return;
	}

	const pool = getDB();
	let group = await pool.query(`
		SELECT * FROM groups WHERE guild_id = '${invite.guild.id}';
	`).catch(console.error);
	if (group.rowCount !== 0) {
		res.redirect('/create_guild/create_server?error=group_already_made');
		return;
	}
	
	res.redirect('/create_guild/setup_server');
}