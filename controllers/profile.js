module.exports = get;

const { getBot } = require('../modules/discord')

function get(req, res) {
	const bot = getBot();
	// if the guild does not exist, return a 404 error
	// FIXME: handle guild not found error
	const guild = bot.guilds.find(guild => guild.name == req.params.guildName.replace(/_/g, ' '));
	const member = guild.members.find(member => member.displayName == req.params.memberName.replace(/_/g, ' '))
	if (!guild || !member) {
		res.status(404).render("pages/unavaliable", {
			session: req.session,
			bot
		});
		return;
	}

	// if the user is not logged into an account in this guild, send an unauthorised error
	if (!req.session.user || !guild.members.get(req.session.user.member_id)) {
		res.status(401).render("pages/unavaliable", {
			session: req.session,
			bot
		});
		return;
	}

	res.render("pages/profile", {
		session: req.session,
		bot,
		member
	});
}
