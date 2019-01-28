module.exports = { get };

const guilds = require('./guild.js');

function get(guildId, memberId) {
	const guild = typeof guildId === 'string' ? guilds.get(guildId) : guildId;
	if (!guild) {
		return { error: 'guild not found' };
	}
	let id = /\d{18}/;
	let member;
	if (memberId.match(id)) {
		member = guild.members.get(memberId);
	} else {
		member = guild.members.find(member => {
			return member.tag === memberId || member.displayName === memberId;
		});
	}
	return member || { error: 'member not found' };
}
