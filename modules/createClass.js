module.exports = giveRoles

const database = require('./database')
const discord = require('./discord')
const colors = require('colors')

async function giveRoles(member, chosenSubjects) {
	// get the guild of the member
	let guild = member.guild;
	let roles = [];
	// iterate through the classes
	for (let division in chosenSubjects) {
		let set = chosenSubjects[division];
		if (set == 'none') { continue }
		// get or create the role
		let role = await getOrMakeRole(guild, set)
		// give that role to the member if they do not already have it
		if (!member.roles.some((hasRole) => hasRole.id == role.id)) {
			roles.push(role);
		} else {}
		// get or create a category for the division
		await createOrGetCat(guild, division)
		let rooms = await getChannelData(role, set, division)
		rooms.rows.forEach(room => {
			createChannelsIfNotExisting(role, room)
		})
	}
	// give the member the role
	return member.addRoles(roles);
}

async function createOrGetCat(guild, division) {
	function matches(cats) { return cats.name == division && cats.type == 'category' }
	let exists = guild.channels.some(matches)
	if (exists) {
		return guild.channels.find(matches)
	} else {
		return createCatagory(guild, division)
	}
}

async function getOrMakeRole(guild, name) {
	// check is the role exists already
	function matches(role) { role.name == name }
	let exists = guild.roles.some(matches)
	if (exists) {
		return guild.roles.find(matches)
	} else {
		// role preferences // TODO: could make role prefs adjustable
		let prefs = {
			name: name,
			color: "ORANGE",
			mentionable: true
		};
		// create the role on the guild
		return guild.createRole(prefs)
			.catch(console.error);
	}
}

async function createCatagory(guild, name) {
	// TODO: add an exlusion role
	let perms = [
		{
			id: guild.id,
			denied: ['VIEW_CHANNEL']
    }
  ]
	let cat = await guild.createChannel(name, "category", perms)
		.catch(console.error);
	console.log(`created: ${cat.name}`.green);
	return cat;
}

async function getChannelData(role, set, division) {
	let pool = database.getDB();
	let rooms = await pool.query(`
    SELECT DISTINCT
      teachers.surname  AS teacher,
      subject.name      AS subject,
      divisions.name    AS division
    FROM sets
    INNER JOIN timetable ON sets.id = timetable.set_id
    INNER JOIN subject   ON timetable.subject_id = subject.id
    INNER JOIN teachers  ON timetable.teacher_id = teachers.id
    INNER JOIN divisions ON sets.division_id = divisions.id
    WHERE sets.set = '${set}' AND divisions.name = '${division}' AND timetable.usual;
  `)
	return rooms;
}

function createChannelsIfNotExisting(role, room) {
	let guild = role.guild;
	let name = `${room.subject}-${room.teacher}`.toLowerCase().replace(/ /g, '-');

	['text', 'voice'].forEach(type => {
		function matchesText(channel) {
			return channel.name == name && channel.type == type && channel.parent.name == room.division
		}
		exists = guild.channels.some(matchesText)
		if (!exists) {
			return createChannels(role, name, room.division, type)
		}
	})
}

async function createChannels(role, name, division, type) {
	let guild = role.guild

	function matchesCat(cats) { return cats.name == division && cats.type == 'category' }
	let cat = guild.channels.find(matchesCat);

	let perms = [
		{
			id: guild.id,
			denied: ['VIEW_CHANNEL']
		}
	]

	let channel = await guild.createChannel(name, type, perms)
		.catch(console.error)
	channel = await channel.setParent(cat);
	channel = await channel.overwritePermissions(role, { 'VIEW_CHANNEL': true })
	console.log(`created channel ${channel.name}`.green)
	return channel;
}
