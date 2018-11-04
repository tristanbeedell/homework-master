module.exports = { get }

const { getBot } = require('./discord.js')

function get(guild) {
	let id = /\d{18}/
	if (guild.match(id)) {
		return getBot().guilds.get(guild)
	} else {
		return getGuildFromName(guild)
	}
}

function getGuildFromName(guild) {
	let guildFound = getBot().guilds.find(val => {
		return val.name === guild
	})
	return guildFound
}
