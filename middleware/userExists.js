module.exports = userExists

const path = require('path');
const discord = require(path.join(__dirname, '../modules/discord'));

function userExists(req, res, next) {
	if (req.url == '/unavaliable' || !req.session.user) {
		return next();
	}
	guild = discord.getBot().guilds.get(req.session.user.guild_id);
	if (!guild) {
		delete req.session.user
		return next();
	}
	member = guild.members.get(req.session.user.member_id);
	if (!member) {
		delete req.session.user
	}
	name = member.displayName;
	next();
}
