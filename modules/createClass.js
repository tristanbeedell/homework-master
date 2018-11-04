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
		}
		// get data for that set from database
		let rooms = await getChannelData(set, division)
		// get or create a category
		for (var i = 0; i < rooms.rows.length; i++) {
			room = rooms.rows[i]
			console.log(room)
			let pool = database.getDB();

			let cat = guild.channels.get(room.catagory_id)
			if (!cat) {
				cat = await createOrGetCat(guild, room.subject)
				pool.query(`
					UPDATE subject
					SET catagory_id = '${cat.id}'
					WHERE name = '${room.subject}' AND group_id = group_id('${guild.id}');
				`).catch(console.error)
			}
			console.log(`catagory: ${cat.name}`)
			let channel = guild.channels.get(room.channel_id)
			if (!channel) {
				channel = await createChannels(role, cat, room)
				pool.query(`
					UPDATE timetable
					SET channel_id = '${channel.id}'
					WHERE set_id = ${room.set_id} AND subject_id = ${room.sub_id} AND teacher_id = ${room.tea_id};
				`).catch(console.error)
			}
			console.log(`channel: ${channel.name}`)
		}
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
	function matches(role) { return role.name == name }
	let exists = guild.roles.some(matches)
	if (exists) {
		return guild.roles.find(matches)
	}
	// role preferences // TODO: could make role prefs adjustable
	let prefs = {
		name: name,
		color: "ORANGE",
		mentionable: true
	};
	console.log(`created: ${name} role`.green)
	// create the role on the guild
	return guild.createRole(prefs)
		.catch(console.error);
}

async function createCatagory(guild, name) {
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

async function getChannelData(set, division) {
	let pool = database.getDB();
	let rooms = await pool.query(`
    SELECT DISTINCT
      teachers.surname  AS teacher,
      subject.name      AS subject,
      divisions.name    AS division,
			subject.catagory_id,
			timetable.channel_id,
			subject.id AS sub_id,
			sets.id AS set_id,
			teachers.id AS tea_id
    FROM sets
    INNER JOIN timetable ON sets.id = timetable.set_id
    INNER JOIN subject   ON timetable.subject_id = subject.id
    INNER JOIN teachers  ON timetable.teacher_id = teachers.id
    INNER JOIN divisions ON sets.division_id = divisions.id
    WHERE sets.set = '${set}' AND divisions.name = '${division}' AND timetable.usual;
  `).catch(console.error)
	return rooms;
}

function createChannels(role, cat, room) {
	let guild = role.guild;
	let name = `${room.subject}-with-${room.teacher}`.toLowerCase().replace(/ /g, '-');

	let channels = [];
	['text', 'voice'].forEach(type => {
		function matchesText(channel) {
			return channel.name == name && channel.type == type && channel.parent && channel.parent.name == room.division
		}
		exists = guild.channels.some(matchesText)
		if (!exists) {
			channels = createChannel(role, name, cat, type)
		}
	})
	return channels
}

async function createChannel(role, name, cat, type) {
	let guild = role.guild

	let W = await getOrMakeRole(guild, 'W')
	let A = await getOrMakeRole(guild, 'A')
	let T = await getOrMakeRole(guild, 'T')

	let perms = [
		{
			id: guild.id,
			denied: ['VIEW_CHANNEL']
		}, {
			id: W.id,
			denied: ['ADD_REACTIONS']
		}, {
			id: A.id,
			denied: ['EMBED_LINKS', 'ATTACH_FILES', 'MENTION_EVERYONE', 'SPEAK']
		}, {
			id: T.id,
			denied: ['READ_MESSAGES', 'READ_MESSAGE_HISTORY', 'SEND_MESSAGES', 'CONNECT', 'VIEW_CHANNEL']
		}
	]

	let channel = await guild.createChannel(name, type, perms)
		.catch(console.error)
	channel = await channel.setParent(cat);
	channel = await channel.overwritePermissions(role, { 'VIEW_CHANNEL': true })
	console.log(`created channel ${channel.name}`.green)
	return channel;
}
