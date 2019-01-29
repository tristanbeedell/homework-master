module.exports = userExists;

const path = require('path');
const discord = require(path.join(__dirname, '../modules/discord'));
const database = require(path.join(__dirname, '../modules/database'));

async function userExists(req, res, next) {
	if (!req.session.user || req.member) {
		return next();
	}
	const guild = discord.getBot().guilds.get(req.session.user.guild_id);
	if (!guild) {
		delete req.session.user;
		req.member = false;
		return next();
	}
	req.member = guild.members.get(req.session.user.member_id);
	if (!req.member) {
		delete req.session.user;
		req.member = false;
	}
	req.color = (await database.getDB().query(`
	SELECT color FROM users WHERE users.id = user_id('${req.member.id}', '${req.member.guild.id}');
	`)).rows[0].color;
	next();
}
