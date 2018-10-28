module.exports = get;

const { getBot } = require('../modules/discord')
const disc = require('../modules/discordFunctions')

function get(req, res) {
	if (!req.session.user) {
		res.render("pages/unavaliable", {
			session: req.session,
			bot: getBot()
		});
		return
	}

	res.render("pages/profile", {
		session: req.session,
		bot: getBot(),
		nickname: req.params.memberName,
		...disc.getMemberandGuild()
	});
}
