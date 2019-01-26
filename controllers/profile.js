module.exports = get;

const path = require('path');
const { getBot } = require(path.join(__dirname, '../modules/discord'));
const { getDB } = require(path.join(__dirname, '../modules/database'));
const { markdown } = require('markdown');

async function get(req, res) {
	const bot = getBot();
	const pool = getDB();
	
	// if the guild does not exist, return a 404 error
	function unavaliable(message) {
		res.status(404).render("pages/unavaliable", {
			...req,
			bot,
			redirect: req.url,
			message
		});
	}

	// if the user is not logged into an account in this guild, send an unauthorised error
	if (!req.member) {
		unavaliable('Not logged in.');
		return;
	}
	
	const guild = bot.guilds.find(guild => guild.name.replace(/ /g, '_') === req.params.guildName);
	if (!guild) {
		unavaliable(`Guild '${req.params.guildName.replace(/_/g, ' ')}' not found.`);
		return;
	}
	const user = guild.members.find(member => member.displayName.replace(/ /g, '_') === req.params.memberName);
	if (!user) {
		unavaliable(`Member '${req.params.memberName.replace(/_/g, ' ')}' was not found in '${req.params.guildName.replace(/_/g, ' ')}'.`);
		return;
	}

	const userData = (await pool.query(`
		SELECT * FROM users WHERE id = user_id('${user.id}', '${guild.id}');
	`)).rows[0];
	if (!userData) {
		unavaliable(`Member '${user.displayName}' hasn't made an account yet.`);
		return;
	}
	userData.bio = userData.bio ? markdown.toHTML(userData.bio) : false;

	res.render("pages/profile", {
		...req,
		bot,
		userData,
		user
	});
}
