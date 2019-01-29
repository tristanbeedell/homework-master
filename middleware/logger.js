// const colors = require('colors');
const morgan = require('morgan');

morgan.token('user', function getUsername(req) {
	if (!req.session.user || !req.member) { return 'logged out'; }
	return req.member.displayName;
});
module.exports = morgan(':date[web]\tHTTP/:http-version\t:method\t:url\t[:status]\t:user\t:response-time');
