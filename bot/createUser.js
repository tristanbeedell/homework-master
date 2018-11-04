const RichEmbed = require('discord.js').RichEmbed;
const pool = require('../modules/database').getDB();
const bcrypt = require("bcrypt");
const urlname = process.env.WEBSITE_URL;

module.exports = { newMember, dmRespond }

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
	What is the Group Pin?`);
	membersAwaiting.push(member.id);
};

function checkMemberFromSchool(msg, callback) {
	pool.query("SELECT * FROM groups")
		.then((groups) => {
			groups.rows.forEach(group => {
				bcrypt.compare(msg.content, group.pin_hash).then(valid => {
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
		.setTitle("SET UP")
		.setColor(0xFF00FF)
		.addField("Give your classes, and you'll be put into chat and voice rooms with everyone else in those classes! ")

	msg.channel.send(embed);
}

function dmRespond(msg) {
	if (membersAwaiting.includes(msg.author.id)) {
		checkMemberFromSchool(msg, (valid, group) => {
			if (valid) {
				sendSetupLink(msg, group)
			}
		})
	}
}
