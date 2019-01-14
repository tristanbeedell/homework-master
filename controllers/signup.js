module.exports = { getSignup, postPasswordIsValid, signup }

const { getBot } = require("../modules/discord")
const db = require("../modules/database")
const bcrypt = require('bcrypt')

let bot;
let pool;

// FEATURE: get fullname and display name.

async function getSignup(req, res) {
	bot = getBot();
	pool = db.getDB();
	// get the member and the guild from discord to check they exist
	let member_id = req.query.member
	let guild_id = req.query.guild
	try {
		let { guild, member } = getGuildAndMember(guild_id, member_id)
	} catch (err) {
		res.status(404).send(err + '<br> Oof! Looks like there was an error! <a href="/help#contact">Contact Tristan</a>.');
		return;
	}

	// check the user hasn't already signed up
	let user = await db.userSignedUp(guild_id, member_id)
	if (user.exists && user.complete) {
		res.redirect(`/guilds/${guild.name}/members/${member.displayName}`.replace(/ /g, '_'));
		return;
	} else if (user.exists && !user.complete && req.session.user) {
		res.redirect(`/signup/timetable`);
		return;
	} else if (user.exists && !user.complete && !req.session.user) {
		res.redirect(`/login?redirect=/signup/timetable`);
		return;
	}

	// check the user has been initialised
	const preuser = await pool.query(`
		SELECT * FROM pre_users
		WHERE member_id = '${member_id}'
		AND guild_id = '${guild_id}'
	`).catch(console.error);

	if (preuser.rowCount < 1) {
		res.status(403).send('oof! this discord account hasn\'t been verified over DM.')
		return;
	}

	const valid = await checkNewUserPassword(req)
	if (!valid) {
		res.status(403).send('oof! You are forbidden from seeing this page.')
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
	let passwordGiven = req.query.password || req.body.password;
	let member_id = req.query.member || req.body.member;
	let guild_id = req.query.guild || req.body.guild;
	let valid = false;
	let passwords = await pool.query(`
    SELECT password FROM pre_users WHERE member_id = '${member_id}' AND guild_id = '${guild_id}';
  `).catch(() => {
		valid = false;
	})
	db.getFirst(passwords,
		(err, pass) => {
			valid = checkValidity(err, pass, passwordGiven)
		}
	)
	return valid;
}

async function postPasswordIsValid(req, res) {
	let valid = await checkNewUserPassword(req)
	res.status(valid ? 200 : 400).end()
}

function checkValidity(err, p, passwordGiven) {
	if (err) {
		console.log(err);
		return false;
	}
	return (p.password == passwordGiven)
}

async function signup(req, res) {
	// TODO: Give error messages on sign up, check for valid username on front end.
	if (!await checkNewUserPassword(req)) {
		res.redirect('back')
		return;
	}
	const guild = getBot().guilds.get(req.query.guild)
	const taken = guild.members.some(member => member.displayName == req.body.nickname)
	if (taken) {
		res.redirect('back')
		return;
	}
	const member = await guild.members.get(req.query.member).setNickname(req.body.nickname);

	let salt = await bcrypt.genSalt(10);
	let passwordhash = await bcrypt.hash(req.body.newpassword, salt);

	req.session.user = {
		member_id: req.query.member,
		guild_id: req.query.guild,
		passwordhash: passwordhash,
		name: member.name
	}

	await save(req.session.user);
	res.redirect('/signup/timetable')
}

async function save(user) {
	pool = db.getDB();

	// Add the new user with their own password.
	await pool.query(`
		INSERT INTO users (member_id, group_id, passwordhash)
		VALUES ('${user.member_id}', group_id('${user.guild_id}'), '${user.passwordhash}')
	`).catch(console.error)

	// remove the pre-user.
	return pool.query(`
		DELETE FROM pre_users
		WHERE member_id = '${user.member_id}'
		AND guild_id = '${user.guild_id}';
	`).catch(console.error);

}
