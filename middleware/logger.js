const colors = require('colors');
const morgan = require('morgan');
const bot = require('../modules/discord');
var fs = require('fs');
// stream = fs.createWriteStream('./access.log', { flags: 'a' });
// date = new Date();
// stream.write(`${date} || server reset\n`);
morgan.token('user', function getUsername(req) {
	if (!req.session.user) { return 'logged out' }
	return bot.getBot().guilds.get(req.session.user.guild_id).members.get(req.session.user.member_id).displayName
})
module.exports = morgan(':date[web]\tHTTP/:http-version\t:method\t:url\t:status\t:user\t:response-time')
