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
			...req,
			bot,
			redirect: req.url
		});
	}

	// if the user is not logged into an account in this guild, send an unauthorised error
	if (!req.member) {
		unavaliable();
		return;
	}
	
	const guild = bot.guilds.find(guild => guild.name.replace(/ /g, '_') == req.params.guildName);
	if (!guild) {
		unavaliable()
		return;
	}
	const user = guild.members.find(member => member.displayName == req.params.memberName.replace(/_/g, ' '))
	if (!user) {
		unavaliable()
		return;
	}

	const userData = (await pool.query(`
		SELECT * FROM users WHERE id = user_id('${user.id}', '${guild.id}');
	`)).rows[0];
	userData.bio = userData.bio ? markdown.toHTML(userData.bio) : false;

	res.render("pages/profile", {
		...req,
		bot,
		userData,
		user
	});
}
