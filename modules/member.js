module.exports = { get }

const { getBot } = require('./discord.js')
const guilds = require('./guild.js')

function get(guild_id, member_id) {
	guild = typeof guild_id == 'string' ? guilds.get(guild_id) : guild_id
	if (!guild) {
		return { error: 'guild not found' }
	}
	let id = /\d{18}/
	let member
	if (member_id.match(id)) {
		member = guild.members.get(member_id)
	} else {
		member = getMemberFromName(member_id)
	}
	return member || { error: 'member not found' }
}

function getMemberFromName(name) {
	let guildFound = guild.members.find(val => {
		return val.displayName === name
	})
	return guildFound
}
