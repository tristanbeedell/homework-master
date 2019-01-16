module.exports = { get, del };

const path = require('path');
const { getBot } = require(path.join(__dirname, '../modules/discord'));
const { getDB } = require(path.join(__dirname, '../modules/database'));

function get(req, res) {
	const bot = getBot();
	// if the guild does not exist, return a 404 error
	function unavaliable() {
		res.status(404).render("pages/unavaliable", {
			session: req.session,
			bot,
			redirect: req.url
		});
	}
	
	// if the user is not logged into an account in this guild, send an unauthorised error
	if (!req.session.user || !guild.members.get(req.session.user.member_id)) {
		unavaliable();
		return;
	}

	res.render("pages/my_profile", {
		session: req.session,
		bot,
		member
	});
}

function del(req, res) {
	if (!req.session.user) {
		return res.status(400).send('user must be logged in order to delete');
	}
	const bot = getBot();
	const pool = getDB();
	// TODO: password verification on account deletion
	let guild = bot.guilds.get(req.session.user.guild_id);
	let member = guild.members.get(req.session.user.member_id);
	member.send(`**You have left ${guild.name}.**\nSorry to see you go! If you have any queries, or problems, feedback is appreciated. :v:`);
	pool.query(`SELECT id FROM users WHERE member_id = '${req.session.user.member_id}';`)
		.then(async user => {
			await pool.query(`DELETE FROM users WHERE id = ${user.rows[0].id};`).catch(console.error)
			await pool.query(`DELETE FROM usr_set_join WHERE user_id = ${user.rows[0].id};`).catch(console.error)
		})
		.catch(console.error)
	member.kick()
	delete req.session.user;
	res.redirect('/join');
}