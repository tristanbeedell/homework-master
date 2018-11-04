module.exports = userExists

const discord = require('../modules/discord')

function userExists(req, res, next) {
	if (req.url == '/unavaliable') { return next() }
	if (req.session.user) {
		guild = discord.getBot().guilds.get(req.session.user.guild_id);
		member = guild.members.get(req.session.user.member_id);
		name = member ? member.nickname || member.user.username : undefined
		if (!name) {
			delete req.session.user
		}
	}
	next()
}
