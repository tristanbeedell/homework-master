module.exports = { getSignup, postPasswordIsValid, signup }

const { getName } = require('../modules/discordFunctions')
const { getBot } = require("../modules/discord")
const db = require("../modules/database")
const bcrypt = require('bcrypt')

let bot;
let pool;

async function getSignup(req, res) {
	bot = getBot();
	pool = db.getDB();
	// get the member and the guild from discord to check they exist
	let member_id = req.query.member
	let guild_id = req.query.guild
	try {
		let { guild, member } = getGuildAndMember(guild_id, member_id)
	} catch (err) {
		res.send(err + '<br> Oof! Looks like there was an error! <a href="/contact">Contact tristan</a>');
		return;
	}

	// check the user hasn't already signed up
	let user = db.userSignedUp(guild_id, member_id)
	if (user.exists && user.complete) {
		res.redirect(`/guilds/${guild.name}/members/${getName(member)}`.replace(/ /, '_'));
		return;
	} else if (user.exists && !user.complete) {
		res.redirect(`/signup/timetable`.replace(/ /, '_'));
		return;
	}

	// check the user has been initialised
	let preuser = await pool.query(`
    SELECT * FROM pre_users
    WHERE member_id = '${member_id}'
    AND guild_id = '${guild_id}'
  `).catch(console.error)
	if (preuser.rowCount < 1) {
		res.redirect('/unavaliable')
		return;
	}

	// render page
	res.render("pages/sign_up", {
		guild: req.query.guild,
		member: req.query.member,
		query: req.query
	});
}

function getGuildAndMember(guild_id, member_id) {
	guild = bot.guilds.get(guild_id);
	if (!guild) { throw "Invalid guild"; }
	member = guild.members.get(member_id);
	if (!member) { throw "Invalid member" }
	return { guild, member }
}

async function checkNewUserPassword(req) {
	pool = db.getDB();
	let passwordGiven = req.body.password;
	let member_id = req.body.member;
	let guild_id = req.body.guild;
	let valid = false;
	let passwords = await pool.query(`
    SELECT password FROM pre_users WHERE member_id = '${member_id}' AND guild_id = '${guild_id}';
  `).catch(console.error)
	db.getFirst(passwords,
		(err, pass) => {
			valid = checkValidity(err, pass, passwordGiven)
		}
	)
	return valid;
}

async function postPasswordIsValid(req, res) {
	let valid = await checkNewUserPassword(req)
	res.send(valid.toString())
}

function checkValidity(err, p, passwordGiven) {
	if (err) {
		console.log(err);
		return false;
	}
	return (p.password == passwordGiven)
}

async function signup(req, res) {
	// TODO: check the name isn't taken on sign up
	if (!await checkNewUserPassword(req)) {
		res.redirect('back')
		return;
	}
	let guild = getBot().guilds.get(req.query.guild)
	//check the username isn't taken
	let taken = guild.members.some(member => (member.user.username || member.nickname) == req.body.nickname)
	if (taken) {
		res.redirect('back')
		return;
	}
	let member = await guild.members.get(req.query.member).setNickname(req.body.nickname);

	let salt = await bcrypt.genSalt(10);
	let passwordhash = await bcrypt.hash(req.body.newpassword, salt);

	req.session.user = {
		member_id: req.query.member,
		guild_id: req.query.guild,
		passwordhash: passwordhash,
		name: member.name
	}

	save(req.session.user)
	res.redirect('/signup/timetable')
}

function save(user) {
	pool = db.getDB();
	return pool.query(`
    INSERT INTO users (member_id, group_id, passwordhash)
    VALUES ('${user.member_id}', group_id('${user.guild_id}'), '${user.passwordhash}')
  `).catch(console.error)
}
