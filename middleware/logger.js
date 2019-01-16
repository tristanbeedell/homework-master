// const colors = require('colors');
const morgan = require('morgan');
const path = require('path');
const bot = require(path.join(__dirname, '../modules/discord'));

morgan.token('user', function getUsername(req) {
	if (!req.session.user) { return 'logged out' }
	return bot.getBot().guilds.get(req.session.user.guild_id).members.get(req.session.user.member_id).displayName
})
module.exports = morgan(':date[web]\tHTTP/:http-version\t:method\t:url\t:status\t:user\t:response-time')
