module.exports = { getMember, getName, getDiscordMember, getMemberandGuild }

const { getBot } = require('./discord.js')

function getMember(guild_id, name) {
	const bot = getBot()
	// find the guild that was selected
	let guild = bot.guilds.get(guild_id)
	if (!guild) {
		return { error: 'guild not found.' }
	}
	// get the correct member by nickname or username
	return getMemberFromName(guild, name)
}

function getName(member) {
	if (member.nickname) {
		return member.nickname
	} else {
		return member.user.username
	}
}

function getDiscordMember(guild_id, memberid) {
	return getBot().guilds.get(guild_id).members.get(memberid);
}

function getMemberandGuild() {
	const bot = getBot()
	// find the guild that was selected
	let guildEntered = bot.guilds.find(val => {
		return val.name === name
	})
	if (!guildEntered) {
		return { error: 'guild not found.' }
	}
	// get the correct member by nickname or username
	getMemberFromName(guild, name)
	return { member, guild };
}

function getMemberFromName(guild, memberName) {
	let member = guild.members.find(val => {
		return val.nickname === memberName || val.user.username === memberName;
	});
	if (!member) {
		return { error: 'member does not exist.' };
	}
	return { member };
}
