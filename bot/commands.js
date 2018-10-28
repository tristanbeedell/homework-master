const Discord = require('discord.js');
const RichEmbed = Discord.RichEmbed;
const url = require('url');

let commands = {};
const urlname = process.env.SERVER_URL;

class Command {
	constructor(name, instructions, func, adminOnly = false) {
		this.name = name;
		this.instructions = instructions;
		this.func = func;
		this.adminOnly = adminOnly;
		this.add();
	}

	add() {
		commands[this.name] = this;
	}
}

new Command("help", "prints out all the commands and what they do", (msg) => {
	let reply = "";
	// for each command in the commands object
	for (var key in commands) {
		// do not list admin only commands
		if (!commands[key].adminOnly) {
			// add command to reply in a new line
			reply += "`" + key + '`\t' + commands[key].instructions + '\n';
		}
	}
	return reply;
});

new Command("profile", "shows everyone your profile on the site.", (msg) => {
	let profileUrl = `${urlname}/guilds/${msg.guild.name}/members/${getName(msg.member)}`.replace(/ /g, "_");
	let embed;
	if (process.env.NODE_ENV != 'production') {
		embed = new RichEmbed()
			.setURL(profileUrl)
			.setAuthor(getName(msg.member), msg.author.avatarURL)
			.setTitle(`${getName(msg.member)}'s Profile`)
			.setColor(0xFFFFFF)
	} else {
		embed = profileUrl
	}
	return embed
});

function getName(member) {
	if (member.nickname) {
		return member.nickname
	} else {
		return member.user.username
	}
}

// TODO: make the whole server setup automated
// TODO: report button

// new Command("!add", "adds all listed to the rotor; `!add, @user1, @user2`", (data) => {
// 	let msg = data.msg;
// 	//cycle through all users listed
// 	data.args.forEach(mention => {
// 		//get the wanted member
// 		let member
// 		if (mention == "me") {
// 			member = msg.member;
// 		} else {
// 			member = msg.guild.members.get(mention.slice(mention.indexOf("!") + 1, mention.indexOf(">")));
// 		}
//
// 		//check that the member exists
// 		if (member == null) {
// 			msg.channel.send("`" + mention + "` is invalid");
// 		} else {
// 			// check that the user isn't already on the rotor
// 			rotored = false;
// 			for (let user = 0; user < data.theClass.rotor.length; user++) {
// 				//if already in the rotor
// 				if (data.theClass.rotor[user] == member.id) {
// 					rotored = true;
// 				}
// 			}
// 			if (rotored == false) {
// 				//add the user to the rotor and respond
// 				classes[msg.channel.parentID].rotor.push(msg.author.id);
// 				msg.channel.send(member.toString() + ' added to rotor');
// 			} else {
// 				// respond anyway
// 				msg.channel.send(member.nickname + ' is already on the rotor.');
// 			}
// 		}
// 	});
// 	//save the updated rotor
// 	jsonfile.writeFile(file, classes, { spaces: 4 }, function (err) {
// 		if (err) console.error(err)
// 		msg.channel.send("all done!");
// 	})
// });
//
// new Command("!next", "says who is next in line", (data) => {
// 	//if only 1 person is in the rotor, no one is next
// 	if (data.theClass.rotor.length == 1) {
// 		data.msg.channel.send("nobady has lined up to help!");
// 	} else {
// 		// respond with the correct username
// 		user = data.client.users.get(data.theClass.rotor[1])
// 		data.msg.channel.send(user.username + " is next");
// 	}
// });
//
// new Command("!rotor", "prints out the rotor", (data) => {
// 	// if the rotor is empty, respond apropriately
// 	if (data.theClass.rotor.length == 0) {
// 		data.msg.channel.send('we searched and searched for someone to help, but the homework was just too boring. Sign up to the rotor now!')
// 	} else {
// 		// the 0th user is 'up now'
// 		user = data.client.users.get(data.theClass.rotor[0])
// 		let reply = "up now:\t`" + user.username + '`\n';
// 		//loop through the rest of the rotor and number them
// 		for (person = 1; person < data.theClass.rotor.length; person++) {
// 			user = data.client.users.get(data.theClass.rotor[person])
// 			reply += person.toString() + ':\t`' + user.username + '`\n';
// 		}
// 		data.msg.channel.send(reply);
// 	}
// });
//
// new Command("!new", "Adds a new homework and assigns the next person on the rotor to do it. [write `!new, {detail or hw link}`]", (data) => {
// 	msg = data.msg;
// 	// if the rotor is empty respond appropriately
// 	if (data.theClass.rotor.length == 0) {
// 		data.msg.channel.send(':crying_cat_face: We searched and searched for someone to help, but the homework was just too boring. Sign up to the rotor now!')
// 	} else {
// 		currentWorker = data.theClass.rotor.splice(0, 1);
// 		data.theClass.rotor.push(currentWorker[0]);
// 		newWorker = data.client.users.get(data.theClass.rotor[0]);
// 		data.msg.channel.send(newWorker.toString() + ' you have to ' + data.args[0] + '. Please share your work in #submit');
//
// 		if (data.args.length > 0) {
// 			classes[msg.channel.parentID].current = data.args[0];
// 		} else {
// 			classes[msg.channel.parentID].current = "do the homework";
// 		}
// 		jsonfile.writeFile(file, classes, { spaces: 4 }, function (err) {
// 			if (err) console.error(err)
// 		})
// 	}
// });
//
// new Command("!current", "Says who's turn it is", (data) => {
// 	msg = data.msg;
// 	data.theClass = classes[msg.channel.parentID];
// 	user = data.client.users.get(data.theClass.rotor[0]);
// 	msg.channel.send("`" + user.username + "` will `" + data.theClass.current + "` :pray:");
// });

module.exports = {
	commands: commands
}
