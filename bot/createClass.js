module.exports = giveRoles

const database = require('../modules/database')
require('colors')

// TODO: add voice channels.

async function giveRoles(member, chosenSubjects) {
	// FIXME: store complete signup in database
	// get the guild of the member
	let guild = member.guild;
	updatePunishRoles(guild);
	// keep an array of roles to be given to the user
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
		// update channels, categories in the discord guild.
		updateClasses(role, set, division)
	}
	// give the member the roles
	return member.addRoles(roles);
}

async function updateClasses(role, set, division) {
	// get the database pool connection
	const pool = database.getDB();

	// retrieve class data from the database
	const rooms = (await getChannelData(set, division)).rows;
	const guild = role.guild;

	// get the category for the subject of the class
	const cat = await setupCat(guild, rooms[0]);

	const general = await setupGeneral(guild, rooms[0], cat, role);

	// allow the new user to view the general.
	await general.overwritePermissions(role, {
		'VIEW_CHANNEL': true,
		'SEND_MESSAGES': true
	});

	// set up the room
	rooms.forEach(async function setupRoom(room) {
		// find the channel for the class room
		let channel = guild.channels.get(room.channel_id);

		// if the room is no found, create it.
		const name = `${role.name}-${room.teacher}`.toLowerCase().replace(/ /g, '-');

		if (!channel) {
			channel = await createChannel(role, name, cat, 'text');
			pool.query(`
				UPDATE timetable
				SET channel_id = '${channel.id}'
				WHERE set_id = ${room.set_id} AND subject_id = ${room.sub_id} AND teacher_id = ${room.tea_id};
			`).catch(console.error);
		}
	});

	// make voice channel
	const name = `${role.name}-voice`.toLowerCase().replace(/ /g, '-');
	if (!guild.channels.find(channel => channel.name == name))
		createChannel(role, name, cat, 'voice');
}

async function setupGeneral(guild, room, cat, role) {
	const pool = database.getDB();

	// get the general channel for the subject of the class
	let channel = guild.channels.get(room.general_id);

	// discord channel valid name
	const name = cat.name.toLowerCase().replace(/ /g, '-');

	// if the general does not exist, create it
	if (!channel) {
		// create the channel
		channel = await createChannel(role, name, cat, 'text')

		// remove the ability to mention everyone in the general chats.
		await channel.overwritePermissions(guild.id, {
			'MENTION_EVERYONE': false
		});

		// update the database to assosiate the subject and general chat
		pool.query(`
			UPDATE subject
			SET general_id = '${channel.id}'
			WHERE catagory_id = '${cat.id}';
		`).catch(console.error)
	} else {
		// ammend channel position error
		if (channel.parent != cat) {
			console.log(`moved ${general.name} into ${cat.name}`);
			channel.setParent(cat);
		}

		// ammend incorrect name
		if (channel.name != name) {
			console.log(`update ${general.name} to ${name}`);
			channel.setName(name);
		}
	}

	return channel;
}

// setup a category using a classroom from database
async function setupCat(guild, room) {
	// attempt to find the category
	let cat = guild.channels.get(room.catagory_id)
	
	// create category if not existing
	if (!cat) {
		cat = await createCatagory(guild, room.subject)
	} 
	// amend misnamed catagory
	else if (cat.name != room.subject) {
		await cat.setName(room.subject)
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

// async function createOrGetCat(guild, division) {
// 	// function to find matching categories
// 	function matches(cats) { return cats.name == division && cats.type == 'category' }

// 	// find if the category exists
// 	let exists = guild.channels.some(matches);

// 	// return the category or crate one if not found
// 	let cat;
// 	if (exists) {
// 		cat = guild.channels.find(matches);
// 	} else {
// 		cat = createCatagory(guild, division);
// 	}
// 	return cat;
// }

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

	// disallow @everyone from viewing the categry
	let perms = [
		{
			id: guild.id,
			denied: ['VIEW_CHANNEL']
    	}
	]
	
	// create the category
	let cat = await guild.createChannel(name, "category", perms)
		.catch(console.error);

	// update the database to remember the guild assosiated with a subject
	database.getDB().query(`
		UPDATE subject
		SET catagory_id = '${cat.id}'
		WHERE name = '${name}' AND group_id = group_id('${guild.id}');
	`).catch(console.error)
	
	// usefull debug info
	console.log(`created catagory: ${cat.name}`.green);
	return cat;
}

async function getChannelData(set, division) {
	// get database pool connection
	const pool = database.getDB();
	// get the rooms
	// FIXME: get channel data for one particular group
	let rooms = await pool.query(`
		SELECT DISTINCT
			teachers.surname	AS teacher,
			subject.name		AS subject,
			divisions.name		AS division,
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

// create text and voice channels
async function createChannels(role, cat, room) {
	// get the guild
	let guild = role.guild;

	// the name the channel will become after creation
	let name = `${role.name}-${room.teacher}`.toLowerCase().replace(/ /g, '-');
	let channels = [];

	// matching function to find channels
	function matchesText(channel) {
		return channel.name == name && channel.parent && channel.parent.name == room.division;
	}

	// find channel
	exists = guild.channels.some(matchesText)
	if (!exists) {
		// create the channel
		channels = await createChannel(role, name, cat, 'text');
		await createChannel(role, name, cat, 'voice');
	}
	return channels;
}

async function createChannel(role, name, cat, type) {
	const guild = role.guild

	// get the punishment roles
	let S = await getOrMakeRole(guild, 'S')
	let W = await getOrMakeRole(guild, 'W')
	let A = await getOrMakeRole(guild, 'A')
	let T = await getOrMakeRole(guild, 'T')

	// permissions
	let perms = [
		{
			id: guild.id,	// everyone
			denied: ['VIEW_CHANNEL']
		}, {
			id: role.id,	// role for the channel
			allowed: ['VIEW_CHANNEL']
		}, {
			id: S.id,	// State role
			denied: ['MENTION_EVERYONE']
		}, {
			id: W.id,	// Warn role
			denied: ['ADD_REACTIONS', 'SEND_TTS_MESSAGES']
		}, {
			id: A.id,	// Action role
			denied: ['EMBED_LINKS', 'ATTACH_FILES', 'SPEAK']
		}, {
			id: T.id,	// Transfer role
			denied: ['READ_MESSAGES', 'READ_MESSAGE_HISTORY', 'SEND_MESSAGES', 'CONNECT', 'VIEW_CHANNEL']
		}
	]

	// create the channel
	let channel = await guild.createChannel(name, type, perms)
		.catch(console.error);
	
	// move into the correct category
	channel = await channel.setParent(cat)
		.catch(console.error);

	// debug info
	console.log(`created channel ${channel.name}`.green);
	return channel;
}
