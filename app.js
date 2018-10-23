// dependencies
const express = require("express"); // for webpage server
const Discord = require("discord.js"); // connecting to discord
const path = require("path"); // a neater way to join paths apparently
const bodyParser = require("body-parser"); // needed for request body
const session = require("express-session"); //for sessions
const bcrypt = require("bcrypt"); //for password encryption
const { Pool, Client } = require('pg') // postgress database
const sslRedirect = require('heroku-ssl-redirect');
// login to discord as the bot using secret bot token provided by discord
const bot = new Discord.Client();
const token = process.env.DISCORD_BOT_SECRET;
bot.login(token).catch(console.error);
bot.on("ready", () => {
	console.log("\x1b[33m", "Webpage connected to discord");
});
// setup the server
const app = express();
var port = process.env.PORT || 8080;
app.listen(port, () => {
	console.log("\x1b[33m", "Webpage on port " + port);
});
// load all the middleware
// setup the app using body parser to embed data in req
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());
app.use(express.static("views"));
// setup for ejs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("public", path.join(__dirname, "public"));
app.use(express.static('public'))
// Use the session middleware
app.use(session({
	secret: "keyboard cat",
	resave: true,
	saveUninitialized: true
}));
// enable ssl redirect for https connections only
if (process.env.NODE_ENV == 'public') {
	app.use(sslRedirect());
}
// connect to database
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: true
});

pool.on('error', (err) => {
	console.error('An idle client has experienced an error', err.stack)
});

app.get("/", (req, res) => {
	res.render("pages/home", {
		session: req.session,
		bot: bot
	});
});

app.get("/FAQ", (req, res) => {
	res.render("pages/FAQ", {
		session: req.session,
		bot: bot
	});
});

app.get("/contact", (req, res) => {
	res.render("pages/FAQ", {
		session: req.session,
		bot: bot
	});
});

app.get("/logout", (req, res) => {
	delete req.session.user;
	res.redirect("back");
});

app.get("/login", (req, res) => {
	// load the login page
	res.render("pages/login", {
		session: req.session,
		bot: bot,
		query: req.query
	});
});

app.post("/validateMember", async (req, res) => {
	// get the member on discord
	getmember = getMemberFromName(req.body.guild, req.body.name)
	if (!getmember.member) {
		res.send(getmember.error)
	} else {
		// get the member from the database
		isMemberSignedUp(getmember.member.id, (valid) => {
			res.send(valid ? "valid" : "member not signed up.")
		})
	}
})

function getMemberFromName(guild_id, name) {
	// find the guild that was selected
	let guildEntered = bot.guilds.get(guild_id)
	if (!guildEntered) {
		return { error: 'guild not found.' }
	}
	// get the correct member by nickname or username
	let member = guildEntered.members.find(val => {
		return val.nickname === name || val.user.username === name
	});
	if (!member) {
		return { error: 'member does not exist.' }
	}
	return { member: member, error: '' };
}

function isMemberSignedUp(member_id, callback) {
	// check that the user exists in database
	pool.query(`SELECT * FROM users WHERE (member_id = '${member_id}');`)
		.then(dbres => {
			callback(dbres.rows.length > 0)
		})
}

app.post("/validatePassword", (req, res) => {
	let error = validatePassword(req.body.guild, req.body.name, req.body.password, (valid) => {
		if (valid) {
			res.send("valid")
		} else {
			res.send("invalid password")
		}
	})
	if (error) {
		res.send(error)
	}
})

function validatePassword(guild_id, name, password, callback) {
	// get the member id from name
	let getmember = getMemberFromName(guild_id, name)
	if (!getmember.member) {
		return getmember.error
	}
	// query database for the password ofthe member
	pool.query(`SELECT passwordhash FROM users WHERE member_id = '${getmember.member.id}' AND group_id = 1`)
		.then(passwords => {
			// compare given pass with hash stored in the database
			bcrypt.compare(password, passwords.rows[0].passwordhash, function (err, valid) {
				if (err) { console.error(err) }
				callback(valid)
			})
		})
		.catch(console.error)
}
// TODO: refactor literally everything because callback hell ew.
app.post("/login", (req, res) => {
	validatePassword(req.body.guild, req.body.name, req.body.password, valid => {
		if (valid) {
			// get the member id from name
			let getmember = getMemberFromName(req.body.guild, req.body.name)
			if (getmember.error) {
				return res.send(getmember.error)
			}
			// query database for the password of the member
			pool.query(`SELECT 	groups.school_name AS name,
													groups.year AS year,
													groups.guild_id AS guild_id,
													users.member_id AS member_id
								FROM users
			INNER JOIN groups ON users.group_id = groups.id
			WHERE users.member_id = '${getmember.member.id}' AND users.group_id = 1`)
				.then(user => {
					// store the user in the browser session
					req.session.user = user.rows[0];
					name = getmember.member.nickname ? getmember.member.nickname : getmember.member.user.username
					req.session.user.name = name
					res.redirect("/")
				})
		} else {
			res.redirect("back")
		}
	})
})

app.get("/guilds/:guildname/members/:username", async (req, res) => {
	// TODO: add more content to profile
	if (!req.session.user) {
		// TODO: make sure that these profiles are private
		return res.render('pages/unavaliable', {
			session: req.session,
			bot: bot
		})
	}
	let guild_id;
	let guild;
	let member;
	let error;
	let user;
	// find the guild on discord
	guild = bot.guilds.find(val => {
		return val.name === req.params.guildname.replace(/_/g, ' ');
	});
	if (!guild) {
		error = "guild not found"
	} else {
		guild_id = guild.id;
		// find the member on discord
		member = guild.members.find(val => {
			let name = req.params.username.replace(/_/g, ' ')
			return val.nickname === name || val.user.username === name;
		});
		if (!member) {
			error = "member not found"
		}
	}
	// ensure that the discord member has signed up to the site (if the member exists)
	if (!error) {
		await pool.query(`SELECT set.name, set.set
		FROM users usr
		INNER JOIN usr_set_join 	j 	ON usr.id = j.user_id
		INNER JOIN sets 					set	ON j.set_id = set.id
		WHERE usr.member_id = '${member.id}';`)
			.then(db_res => {
				if (db_res.rows.length < 1) {
					error = "User has not signed up. Go give them a budge";
				} else {
					classes = db_res.rows;
				}
			})
			.catch(console.error);
	}
	if (error) {
		res.render("pages/unavaliable", {
			session: req.session,
			bot: bot
		});
	} else {
		res.render("pages/profile", {
			discordMember: member,
			guild_id: guild_id,
			session: req.session,
			bot: bot,
			classes: classes,
			nickname: getName(member)
		});
	}
});

app.get("/guilds/:guildname/", async (req, res) => {
	if (!req.session.user) {
		return res.render('pages/unavaliable', {
			session: req.session,
			bot: bot
		})
	} else {
		res.render('pages/my_guild', {
			guild: {
				name: req.params.guildname,
				id: req.session.user.guild_id
			},
			session: req.session,
			bot: bot
		})
	}
});

app.delete("/guilds/:guildname/members/:username", (req, res) => {
	let guild = bot.guilds.get(req.session.user.guild_id)
	let member = guild.members.get(req.session.user.member_id)
	if (member.nickname == req.params.username) {
		pool.query(`SELECT id FROM users WHERE member_id = '${req.session.user.member_id}';`)
			.then(user => {
				pool.query(`DELETE FROM users WHERE id = ${user.rows[0].id};`)
				pool.query(`DELETE FROM usr_set_join WHERE user_id = ${user.rows[0].id};`)
			})
			.catch(console.error)
		member.kick()
		delete req.session.user;
		res.send('i did it now do a reload')
	}
})

app.get('/invite', (req, res) => {
	// if uninvited let the user join, else show the invite
	if (req.session.invite) {
		bot.fetchInvite(req.session.invite.url)
			.then(invite => {
				pool.query(`SELECT 	groups.school_name,
														groups.invite,
														groups.year,
														users.member_id as creator_id
										FROM groups
										LEFT JOIN users ON groups.creator_id = users.id
										WHERE groups.guild_id = '${invite.guild.id}';`)
					.then(group => {
						bot.fetchUser(group.rows[0].creator_id)
							.then(creator => {
								res.render('pages/invite', {
									session: req.session,
									bot: bot,
									invite: invite,
									guild: invite.guild,
									group: group.rows[0],
									creator: creator
								});
							})
							.catch(console.error)
					})
					.catch(console.error)
			})
			.catch(() => {
				delete req.session.invite;
				res.redirect('/join');
			});
	} else {
		res.redirect('/join')
	}
});

app.get('/join', (req, res) => {
	// if already invited, show the invite, else let the user join
	if (req.session.invite) {
		res.redirect('/invite')
	} else {
		res.render('pages/join', {
			session: req.session,
			bot: bot,
			query: req.query
		});
	}
});

app.post('/join', (req, res) => {
	pool.query(`SELECT * FROM groups WHERE guild_id = '${req.body.guild}';`)
		.then((groups) => {
			if (groups.rowCount == 1) {
				group = groups.rows[0]
				bcrypt.compare(req.body.pin, group.pin_hash)
					.then(valid => {
						if (valid) {
							let guild = bot.guilds.get(group.guild_id)
							let inviteChannel = guild.channels.find(channel => {
								return channel.name == 'new-members'
							})
							inviteChannel.createInvite({ maxAge: 120, maxUses: 1 })
								.then(invite => {
									// remove any thing circular
									req.session.invite = { url: invite.url };
									req.session.guild = {
										name: invite.guild.name
									}
									res.redirect('/invite');
								})
						} else {
							res.redirect("back")
						}
					}).catch(console.error)
			} else {
				res.redirect("back")
			}
		})
		.catch(console.error)
});

app.get("/signup", (req, res) => {
	let success = true;
	let guild;
	let member;
	// ensure that the user is in a guild on discord that the bot is in
	try {
		guild = bot.guilds.get(req.query.guild);
		if (!guild) { throw "Invalid guild"; }
		member = guild.members.get(req.query.member);
		if (!member) { throw "Invalid member" }
	} catch (err) {
		res.send(err);
		success = false;
	}
	if (success) {
		pool.query("SELECT * FROM users WHERE member_id = '" + req.query.member + "';")
			.then(db_res => {
				if (db_res.rows.length < 1) {
					pool.query(`
						SELECT sets.set AS name, divisions.name AS div
						FROM sets
						INNER JOIN divisions ON divisions.id = sets.division_id;`)
						.then(sets_res => {
							pool.query(`SELECT name FROM divisions WHERE group_id = 1;`)
								.then(divs_res => {
									res.render("pages/sign_up", {
										subjects: { divs: divs_res.rows, sets: sets_res.rows },
										guild: req.query.guild,
										member: req.query.member,
										discordMember: member,
										message: req.query.message
									});
								}).catch(console.error);
						})
				} else {
					res.redirect(`/guilds/${guild.name}/members/${getName(member)}`.replace(/ /, '_'));
				}
			})
			.catch(console.error)
	}
});

app.post("/signup", (req, res) => {
	// TODO: verify in backend
	let newMember = new Member(req.body.nickname, req.body.guild, req.body.member, req.body.classes);
	// hash and salt the password.
	bcrypt.genSalt(10, function (err, salt) {
		if (err) { console.log(err.stack) }
		bcrypt.hash(req.body.newpassword, salt, async (err, hash) => {
			if (err) { console.log(err.stack) }
			newMember.password = hash; // store hashed password
			req.session.user = newMember; // keep the user logged in
			newMember.save() // save new user to database
			// remove the pre-user
			pool.query(`DELETE FROM pre_users WHERE member_id = '${newMember.memberid}';`)
			// get the discord account
			let discordMember = getDiscordMember(req.body.guild, req.body.member);
			giveRoles(discordMember, newMember.classes); // give the user access to their classes.
			discordMember.setNickname(req.body.nickname); // set the user's name on discord to match.
			discordMember.send("All done! If you want me again then type `!help` in the server");
			let guild = bot.guilds.get(req.body.guild);
			res.redirect(`/guilds/${guild.name}/members/${getName(discordMember)}`.replace(/ /g, '_'));
		});
	});
});

function getDiscordMember(guild_id, memberid) {
	return bot.guilds.get(guild_id).members.get(memberid);
}

class Member {
	constructor(name, guild, member, classes) {
		this.classes = classes;
		this.name = name;
		this.guild_id = guild;
		this.memberid = member;
		this.password = "";
	}

	save() {
		// create the user in the users table
		return pool.query(`	INSERT INTO users (member_id, group_id, passwordhash)
		 										VALUES ('${this.memberid}', 1, '${this.password}');`)
			.then(() => {
				// get the id of the new user to add the classes in the joining table.
				pool.query(`SELECT id FROM users WHERE member_id = '${this.memberid}';`)
					.then(async (db_user) => {
						let user_id = db_user.rows[0].id;
						for (let subject in this.classes) {
							await pool.query(`SELECT id FROM sets WHERE set = '${this.classes[subject]}';`)
								.then((db_set) => {
									if (db_set.rows.length > 0) {
										let set_id = db_set.rows[0].id;
										return pool.query(`INSERT INTO usr_set_join (user_id, set_id) VALUES (${user_id}, ${set_id});`)
											.catch(console.error);
									}
								})
								.catch(console.error)
						}
					})
					.catch(console.error);
			})
			.catch(console.error);
	}
}

function giveRoles(member, chosenSubjects) {
	console.log(chosenSubjects)
	let guild = member.guild;
	for (let subject in chosenSubjects) {
		let classroom = chosenSubjects[subject];
		if (classroom == null) {
			continue;
		}
		let prefs = {
			name: classroom,
			color: "ORANGE",
			mentionable: false
		};
		if (guild.roles.some(val => {
				return val.name === classroom;
			})) {
			member.addRole(guild.roles.find(val => {
				return val.name === classroom;
			}));
		} else {
			guild.createRole(prefs).then(role => {
				member.addRole(role);
				pool.query(`SELECT
											distinct(teachers.surname) AS teacher,
											sets.set AS set,
											subject.name AS subject
									FROM sets
									INNER JOIN timetable ON sets.id = timetable.set_id
									INNER JOIN subject   ON timetable.subject_id = subject.id
									INNER JOIN teachers  ON timetable.teacher_id = teachers.id
									INNER JOiN divisions ON sets.division_id = divisions.id
									WHERE sets.set = '${classroom}' AND divisions.name = '${subject}' AND subject.discord_room;`)
					.then(rooms => {
						rooms.rows.forEach(async room => {
							await createClassroom(room, role, guild, prefs).catch(console.error);
						})
					})
			}).catch(console.error);
		}
	}
}

function createClassroom(room, role, guild, prefs) {
	// TODO: add an exlusion role
	let perms = [
		{
			id: guild.id,
			denied: ["VIEW_CHANNEL"]
    }, {
			id: role.id,
			allowed: ["VIEW_CHANNEL", "MENTION_EVERYONE"]
    }
  ];
	return guild.createChannel(room.teacher, "category", perms).then(category => {
		prefs.id = category.id;
		prefs.guild = guild;
		// new Class(prefs);
		category.overwritePermissions(role, {
			VIEW_CHANNEL: true
		}).then(category => {
			console.log("\x1b[32m", "created: " + category.name);
      [room.subject].forEach(channelName => {
				guild.createChannel(channelName, "text", perms).then(channel => {
					channel.setParent(category).then(updated => {
						console.log("\x1b[32m", "created: " + channel.name + " in " + category.name);
					}).catch(console.error);
				}).catch(console.error);
			});
			guild.createChannel("voice", "voice", perms).then(channel => {
				channel.setParent(category).then(updated => {
					console.log("\x1b[32m", "created: " + channel.name + " in " + category.name);
				}).catch(console.error);
			}).catch(console.error);
		}).catch(console.error);
	}).catch(console.error);
}

app.post("/timetabledata", (req, res) => {
	pool.query(`
		SELECT 	timetable.teacher,
						timetable.period,
						timetable.day,
						timetable.class,
						timetable.division,
						override.name as override
		FROM divisions as override
		RIGHT JOIN (
			SELECT 	teachers.name as teacher,
					timetable.period,
					timetable.day,
					subject.name AS class,
					divisions.name AS division,
					sets.overrides AS overrides
			FROM timetable
			LEFT JOIN teachers  	ON teachers.id = timetable.teacher_id
			INNER JOIN sets 	 		ON sets.id = timetable.set_id
			INNER JOIN subject 	 	ON timetable.subject_id = subject.id
			INNER JOIN divisions 	ON sets.division_id = divisions.id
			WHERE sets.set = '${req.body.set}' AND divisions.name = '${req.body.sub}') AS timetable
		ON timetable.overrides = override.id;`)
		.then((db_res) => {
			res.json(db_res);
			// console.log(db_res)
		})
		.catch(console.error);
})

app.post("/checkNewUserPassword", (req, res) => {
	let passwordGiven = req.body.password;
	let member_id = req.body.member;
	let guild_id = req.body.guild;
	pool.query(`SELECT passwordhash FROM pre_users WHERE member_id = '${member_id}' AND guild_id = '${guild_id}';`)
		.then(passwordsFound => {
			res.send(passwordsFound.rows[0].passwordhash == passwordGiven)
		})
		.catch(console.error)
})

function getName(member) {
	if (member.nickname) {
		return member.nickname
	} else {
		return member.user.username
	}
}
