const RichEmbed = require('discord.js').RichEmbed;
const pool = require('../modules/database').getDB();
const respond = require('./commands.js');
const bcrypt = require("bcrypt");
const urlname = process.env.WEBSITE_URL;

module.exports = { newMember, dmRespond }

// TODO: move the membersAwaiting out of local memory.
let membersAwaiting = [];

function createPreUser(memberid, guildid) {
	let password = randomStr(5);
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
	membersAwaiting.push(member.id);
};

function checkMemberFromSchool(msg, callback) {
	pool.query("SELECT * FROM groups")
		.then((groups) => {
			groups.rows.forEach(group => {
				bcrypt.compare(msg.content, group.pin_hash)
					.then(valid => {
						callback(valid, group)
					})
					.catch(console.error)
			})
		})
		.catch(console.error)
}

function sendSetupLink(msg, group) {
	let password = createPreUser(msg.author.id, group.guild_id);
	let setupURL = `${urlname}/signup?guild=${group.guild_id}&member=${msg.author.id}&password=${password}`;
	let embed;
	embed = new RichEmbed()
		.setURL(setupURL)
		.setTitle("CLICK TO SET UP")
		.setColor(0xFF00FF)
		.setDescription("Give your classes, and you'll be put into text and voice chat rooms with everyone else in those classes!")

	msg.channel.send(embed);
}

function dmRespond(msg) {
	if (membersAwaiting.includes(msg.author.id)) {
		checkMemberFromSchool(msg, (valid, group) => {
			if (valid) {
				sendSetupLink(msg, group)
				membersAwaiting = membersAwaiting.filter(id => id !== msg.author.id);
			} else {
				msg.channel.send(`**Invalid Pin**
Make sure you send the exact pin and nothing else in the message. It **is** case sensitive.
Please try again...`)
			}
		})
	} else {
		let tokens = msg.content;
		respond({ msg, tokens });
	}
}
