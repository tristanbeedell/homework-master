module.exports = get;

const path = require('path');
const { getBot } = require(path.join(__dirname, '../modules/discord'))
const { getDB } = require(path.join(__dirname, '../modules/database'))
const { markdown } = require('markdown');

async function get(req, res) {
	const bot = getBot();
	const pool = getDB();
	
	// if the guild does not exist, return a 404 error
	function unavaliable() {
		res.status(404).render("pages/unavaliable", {
			session: req.session,
			bot,
			redirect: req.url
		});
	}
	
	const guild = bot.guilds.find(guild => guild.name.replace(/ /g, '_') == req.params.guildName);
	if (!guild) {
		unavaliable()
		return;
	}
	const member = guild.members.find(member => member.displayName == req.params.memberName.replace(/_/g, ' '))
	if (!member) {
		unavaliable()
		return;
	}

	// if the user is not logged into an account in this guild, send an unauthorised error
	if (!req.session.user || !guild.members.get(req.session.user.member_id)) {
		unavaliable();
		return;
	}

	const userData = (await pool.query(`
		SELECT * FROM users WHERE id = user_id('${req.session.user.member_id}', '${req.session.user.guild_id}');
	`)).rows[0];
	userData.bio = markdown.toHTML(userData.bio);


	res.render("pages/profile", {
		session: req.session,
		bot,
		member,
		userData
	});
}
