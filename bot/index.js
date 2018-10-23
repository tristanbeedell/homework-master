//discord bot library
const Discord = require('discord.js');
const client = new Discord.Client();
const token = process.env.DISCORD_BOT_SECRET;
//import all commands I made for the bot
const commandsScript = require('./commands.js');
const commands = commandsScript.commands;
//storing class data
const { Pool } = require('pg') // postgress database
// connect to database
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: true
});
const bcrypt = require("bcrypt"); //for pin encryption
const RichEmbed = Discord.RichEmbed;
let urlname = 'https://homework-staging.herokuapp.com'

client.on('ready', () => {
	console.log("\x1b[33m", "Bot connected");
	client.user.setPresence({ game: { name: '!help', type: 'LISTENING' }, status: 'active' })
		.catch(console.error);
});

client.on('message', msg => {
	if (msg.channel.type == "dm" && msg.author.id != client.user.id) {
		if (membersAwaiting.includes(msg.author.id)) {
			checkMemberFromSchool(msg, (valid, group) => {
				if (valid) {
					sendSetupLink(msg, group)
				}
			})
		}
	} else if (msg.author.id != client.user.id && msg.content.slice(0, 1) == "!") {
		sections = msg.content.split(" ");
		theCommand = commands[sections[0]];
		arguments = sections.splice(1, sections.length);

		if (theCommand != null) {
			if (theCommand.adminOnly && !msg.member.hasPermission("ADMINISTRATOR")) {
				msg.channel.send(":rolling_eyes: You must be an admin in order to execute this command!")
			} else {
				theCommand.func({
					msg: msg,
					args: arguments,
					client: client
				});
			}
		} else {
			msg.channel.send(":thinking_face: Invalid. Use `!help` if you need help.")
		}
	}
	//testing new member
	if (msg.content == "im new") {
		let member = msg.member;
		newMember(member);
	}
});

function createPreUser(memberid, guildid) {
	let password = randomStr(5);
	pool.query(`INSERT INTO pre_users (passwordhash, member_id, guild_id)
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
				bcrypt.compare(msg.content, group.pin_hash).then(valid => { callback(valid, group) }).catch(console.error)
			})
		})
		.catch(console.error)
}

function sendSetupLink(msg, group) {
	let password = createPreUser(msg.author.id, group.guild_id);
	let setupURL = `${urlname}/signup?guild=${group.guild_id}&member=${msg.author.id}`;
	const embed = new RichEmbed()
		.setURL(setupURL)
		.setTitle("SET UP")
		.setColor(0xFF00FF)
		.addField("Use the password: " + password,
			"Give your classes, and you'll be put into chat and voice rooms with everyone else in those classes! ")
	if (process.env.NODE_ENV == 'production') {
		embed.setDescription(`localhost:5000/signup?guild=${group.guild_id}&member=${msg.author.id}`);
	}
	msg.channel.send(embed);
}

let membersAwaiting = [];

client.on('guildMemberAdd', newMember)

client.login(token);
