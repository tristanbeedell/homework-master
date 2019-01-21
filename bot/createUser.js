const RichEmbed = require('discord.js').RichEmbed;
const path = require('path');
const database = require(path.join(__dirname, '../modules/database'));
const bot = require(path.join(__dirname, '../modules/discord')).getBot();
const respond = require(path.join(__dirname, './commands.js'));
const bcrypt = require("bcrypt");
const urlname = process.env.WEBSITE_URL;

module.exports = { newMember, dmRespond };

let membersAwaiting = [];

function createPreUser(memberid, guildid) {
	let password = randomStr(5);
	const pool = database.getDB();
	pool.query(`INSERT INTO pre_users (password, member_id, guild_id)
	VALUES ('${password}', '${memberid}', '${guildid}');`)
		.catch(console.error);
	return password;
}

function randomStr(len) {
	return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, len);
}

function newMember(member) {
	member.send(`Hi! Looks like you're new to ${member.guild.name}.
**What is the Group Pin?**`);
	membersAwaiting.push(member);
}

async function checkMemberFromSchool(pin, id, callback) {
	const pool = database.getDB();
	const groups = await pool.query(`SELECT pin_hash FROM groups WHERE guild_id = '${id}';`)
		.catch(console.error);
	if (groups.rows.length == 0) { return callback(false); }
	const group = groups.rows[0];
	const valid = bcrypt.compareSync(pin, group.pin_hash);
	callback(valid, group);
}

function sendSetupLink(member) {
	let password = createPreUser(member.id, member.guild.id);
	let setupURL = `${urlname}/signup?guild=${member.guild.id}&member=${member.id}&password=${password}`;
	let embed;
	embed = new RichEmbed()
		.setURL(setupURL)
		.setTitle("CLICK TO SET UP")
		.setColor(0xFF00FF)
		.setDescription("Give your classes, and you'll be put into text and voice chat rooms with everyone else in those classes!");

	member.send(embed);
}


function sendTimetableLink(member) {
	const setupURL = `${urlname}/signup/timetable`;
	const embed = new RichEmbed()
		.setURL(setupURL)
		.setTitle("CLICK TO ENTER YOUR TIMETABLE")
		.setColor(0xFF00FF)
		.setDescription("Give your classes, and you'll be put into text and voice chat rooms with everyone else in those classes!");

	member.send(embed);
}

async function dmRespond(msg) {
	const members = membersAwaiting.filter(member => member.id === msg.author.id);
	let member;
	if (members.length === 1) {
		member = members[0];
	}
	if (member) {
		checkMemberFromSchool(msg.content, member.guild.id, (valid) => {
			if (valid) {
				sendSetupLink(member);
				membersAwaiting = membersAwaiting.filter(member => member.id !== msg.author.id);
			} else {
				msg.channel.send(`**Invalid Pin**
Make sure you send the exact pin and nothing else in the message. It is **case sensitive**.
Please try again...`);
			}
		});
	} else if (msg.content.match(/^\s*sign\s?up/)) {
		signupCommand(msg);
	} else {
		let tokens = msg.content;
		respond({ msg, tokens });
	}
}

async function signupCommand (msg) {
	// find the guild given by name
	const guild = bot.guilds.find(guild => guild.name === msg.content.match(/^\s*sign\s?up\s*(.*)\s*$/)[1]);
	if (!guild) {
		msg.channel.send('**Invalid group.** Give a group as follows: `signup Group Name`');
		return;
	}
	// find the member in that guild
	const member = guild.members.get(msg.author.id);
	if (!member) {
		msg.channel.send('You are not in this server.');
		return;
	}

	// get sign up status of that member in that guild
	const status = await database.userSignedUp(member.guild.id, member.id);
	if (!status.exists) {
		newMember(member);
	} else if (!status.complete) {
		sendTimetableLink(member);
		membersAwaiting = membersAwaiting.filter(member => member.id !== msg.author.id);
	} else {
		msg.channel.send('You\'re already signed up.');
		membersAwaiting = membersAwaiting.filter(member => member.id !== msg.author.id);
	}

}