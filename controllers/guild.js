module.exports = get;

const path = require('path');
const { getBot } = require(path.join(__dirname, '../modules/discord'));

function get(req, res) {
	const bot = getBot();
	// if the guild does not exist, return a 404 error
	const guild = bot.guilds.find(guild => guild.name == req.params.guildName.replace(/_/g, ' '));
	if (!guild) {
		res.status(404).render("pages/unavaliable", {
			session: req.session,
			bot,
			redirect: req.url
		});
		return;
	}

	// if the user is not logged into an account in this guild, send an unauthorised error
	if (!req.session.user || !guild.members.get(req.session.user.member_id)) {
		res.status(401).render("pages/unavaliable", {
			session: req.session,
			bot,
			redirect: req.url
		});
		return;
	}

	res.render("pages/guild", {
		session: req.session,
		bot,
		guild
	});
}
