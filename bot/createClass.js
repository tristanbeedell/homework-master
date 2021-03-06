module.exports = giveRoles;

const path = require('path');
const database = require(path.join(__dirname, '../modules/database'));
require('colors');

async function giveRoles(member, chosenSubjects) {
	// get the guild of the member
	let guild = member.guild;
	updatePunishRoles(guild);
	// keep an array of roles to be given to the user
	let roles = [];
	// iterate through the classes
	for (let division in chosenSubjects) {
		let set = chosenSubjects[division];
		if (set === 'none') { continue; }
		// get or create the role
		let role = await getOrMakeRole(guild, set);
		role.setColor('88c65a');
		// give that role to the member if they do not already have it
		if (!member.roles.some((hasRole) => hasRole.id === role.id)) {
			roles.push(role);
		}
		// update channels, categories in the discord guild.
		updateClasses(role, set, division);
	}
	await database.getDB().query(`

	`);
	// give the member the roles
	return member.addRoles(roles);
}

async function updateClasses(role, set, division) {
	// get the database pool connection
	const pool = database.getDB();

	// retrieve class data from the database
	const guild = role.guild;
	const rooms = (await getChannelData(set, division, guild)).rows;

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
	if (!guild.channels.find(channel => channel.name === name))
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
		channel = await createChannel(role, name, cat, 'text');

		// remove the ability to mention everyone in the general chats.
		await channel.overwritePermissions(guild.id, {
			'MENTION_EVERYONE': false
		});

		// update the database to assosiate the subject and general chat
		pool.query(`
			UPDATE subject
			SET general_id = '${channel.id}'
			WHERE catagory_id = '${cat.id}';
		`).catch(console.error);
	} else {
		// ammend channel position error
		if (channel.parent !== cat) {
			console.log(`moved ${channel.name} into ${cat.name}`);
			channel.setParent(cat);
		}

		// ammend incorrect name
		if (channel.name !== name) {
			console.log(`update ${channel.name} to ${name}`);
			channel.setName(name);
		}
	}

	return channel;
}

// setup a category using a classroom from database
async function setupCat(guild, room) {
	// attempt to find the category
	let cat = guild.channels.get(room.catagory_id);
	
	// create category if not existing
	if (!cat) {
		cat = await createCatagory(guild, room.subject);
	} 
	// amend misnamed catagory
	else if (cat.name !== room.subject) {
		await cat.setName(room.subject);
	}

	return cat;
}

async function updatePunishRoles(guild) {
	const S = await getOrMakeRole(guild, 'S');
	S.setColor('71a947');
	const W = await getOrMakeRole(guild, 'W');
	W.setColor('acb351');
	const A = await getOrMakeRole(guild, 'A');
	A.setColor('b58b52');
	const T = await getOrMakeRole(guild, 'T');
	T.setColor('a22f2f');
}

async function getOrMakeRole(guild, name) {
	// check is the role exists already
	function matches(role) { return role.name === name; }
	let exists = guild.roles.some(matches);
	if (exists) {
		return guild.roles.find(matches);
	}
	// role preferences
	let prefs = {
		name: name,
		color: "ORANGE",
		mentionable: true
	};
	console.log(`created: ${name} role`.green);
	// create the role on the guild
	const role = await guild.createRole(prefs)
		.catch(console.error);

	const pool = database.getDB();
	pool.query(`
	UPDATE sets SET role_id = '${role.id}'
	WHERE sets.id = set_id('${name}', '${guild.id}');
	`);
	return role;
}

async function createCatagory(guild, name) {

	// disallow @everyone from viewing the categry
	let perms = [
		{
			id: guild.id,
			denied: ['VIEW_CHANNEL']
		}
	];
	
	// create the category
	let cat = await guild.createChannel(name, "category", perms)
		.catch(console.error);

	// update the database to remember the guild assosiated with a subject
	database.getDB().query(`
		UPDATE subject
		SET catagory_id = '${cat.id}'
		WHERE name = '${name}' AND group_id = group_id('${guild.id}');
	`).catch(console.error);
	
	// usefull debug info
	console.log(`created catagory: ${cat.name}`.green);
	return cat;
}

async function getChannelData(set, division, guild) {
	// get database pool connection
	const pool = database.getDB();
	// get the rooms
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
		INNER JOIN groups ON sets.group_id = groups.id
		WHERE sets.set = $1 AND divisions.name = $2
		AND groups.guild_id = '${guild.id}' AND timetable.usual;
	`, [set, division]).catch(console.error);
	return rooms;
}

async function createChannel(role, name, cat, type) {
	const guild = role.guild;

	// get the punishment roles
	let S = await getOrMakeRole(guild, 'S');
	let W = await getOrMakeRole(guild, 'W');
	let A = await getOrMakeRole(guild, 'A');
	let T = await getOrMakeRole(guild, 'T');

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
	];

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
