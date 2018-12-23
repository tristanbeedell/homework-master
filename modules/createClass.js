module.exports = giveRoles

const database = require('./database')
const discord = require('./discord')
const colors = require('colors')

async function giveRoles(member, chosenSubjects) {
	// TODO: store complete signup in database
	// get the guild of the member
	let guild = member.guild;
	updatePunishRoles(guild);
	let roles = [];
	// iterate through the classes
	for (let division in chosenSubjects) {
		let set = chosenSubjects[division];
		if (set == 'none') { continue }
		// get or create the role
		let role = await getOrMakeRole(guild, set);
		role.setColor('88c65a')
		// give that role to the member if they do not already have it
		if (!member.roles.some((hasRole) => hasRole.id == role.id)) {
			roles.push(role);
		}
		updateClasses(role, set, division)
	}
	// give the member the role
	return member.addRoles(roles);
}

async function updateClasses(role, set, division) {
	let pool = database.getDB();
	let guild = role.guild;
	let rooms = (await getChannelData(set, division)).rows

	let cat = await setupCat(guild, rooms[0]);
	let name = cat.name.toLowerCase().replace(/ /g, '-');
	let channel = guild.channels.find(c => c.name == name)
	if (!channel) {
		channel = await createChannel(role, name, cat, 'text')
		await channel.overwritePermissions(guild.defaultRole, {
			'MENTION_EVERYONE': false
		})
		pool.query(`
			UPDATE subject
			SET general_id = '${channel.id}'
			WHERE catagory_id = '${cat.id}';
		`).catch(console.error)
	}
	await channel.overwritePermissions(role, {
		'VIEW_CHANNEL': true,
		'SEND_MESSAGES': true
	})
	if (channel.parent != cat) {
		console.log(`moved ${channel.name} into ${cat.name}`)
		channel.setParent(cat)
	}
	if (channel.name != name) {
		console.log(`update ${channel.name} to ${name}`)
		channel.setName(name)
	}

	rooms.forEach(async room => {
		let channel = guild.channels.get(room.channel_id)
		if (!channel) {
			channel = await createChannels(role, cat, room, 'text')
			pool.query(`
				UPDATE timetable
				SET channel_id = '${channel.id}'
				WHERE set_id = ${room.set_id} AND subject_id = ${room.sub_id} AND teacher_id = ${room.tea_id};
			`).catch(console.error)
		}
		if (channel.parent != cat) {
			console.log(`moved ${channel.name} into ${cat.name}`)
			channel.setParent(cat)
		}
		let name = `${role.name}-${room.teacher}`.toLowerCase().replace(/ /g, '-');
		if (channel.name != name) {
			console.log(`update ${channel.name} to ${name}`)
			channel.setName(name)
		}
	})
}

async function setupCat(guild, room) {
	let cat = guild.channels.get(room.catagory_id)
	if (cat && cat.name != room.subject) {
		await cat.setName(room.subject)
	}
	if (!cat) {
		cat = await createOrGetCat(guild, room.subject, room)
	}
	return cat;
}

async function updatePunishRoles(guild) {
	S = await getOrMakeRole(guild, 'S')
	S.setColor('71a947')
	W = await getOrMakeRole(guild, 'W')
	W.setColor('acb351')
	A = await getOrMakeRole(guild, 'A')
	A.setColor('b58b52')
	T = await getOrMakeRole(guild, 'T')
	T.setColor('a22f2f')
}

async function createOrGetCat(guild, division, room) {
	function matches(cats) { return cats.name == division && cats.type == 'category' }
	let exists = guild.channels.some(matches)
	let cat;
	if (exists) {
		cat = guild.channels.find(matches)
	} else {
		cat = createCatagory(guild, division)
	}
	return cat;
}

async function getOrMakeRole(guild, name) {
	// check is the role exists already
	function matches(role) { return role.name == name }
	let exists = guild.roles.some(matches)
	if (exists) {
		return guild.roles.find(matches)
	}
	// IDEA: could make role prefs adjustable
	// role preferences
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
	database.getDB().query(`
		UPDATE subject
		SET catagory_id = '${cat.id}'
		WHERE name = '${name}' AND group_id = group_id('${guild.id}');
	`).catch(console.error)
	console.log(`created catagory: ${cat.name}`.green);
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
				subject.general_id,
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

function createChannels(role, cat, room, type) {
	let guild = role.guild;
	let name = `${role.name}-${room.teacher}`.toLowerCase().replace(/ /g, '-');
	let channels = [];

	function matchesText(channel) {
		return channel.name == name && channel.type == type && channel.parent && channel.parent.name == room.division
	}
	exists = guild.channels.some(matchesText)
	if (!exists) {
		channels = createChannel(role, name, cat, type)
	}
	return channels
}

async function createChannel(role, name, cat, type) {
	let guild = role.guild
	let S = await getOrMakeRole(guild, 'S')
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
