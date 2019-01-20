module.exports = { get, postPasswordIsValid, post }

const path = require('path');
const url = require('url');
const { getBot } = require(path.join(__dirname, "../modules/discord"))
const database = require(path.join(__dirname, "../modules/database"))
const bcrypt = require('bcrypt');

// FEATURE: get fullname and display name.

async function get(req, res) {
	const pool = database.getDB();

	// get the member and the guild from discord to check they exist
	const member_id = req.query.member;
	const guild_id = req.query.guild;
	const { guild, member } = await getGuildAndMember(guild_id, member_id);
	if (!guild || !member){
		res.status(404).send(`Invalid <br> Oof! Looks like there was an error! <a href="/help#contact">Contact Tristan</a>.`);
		return;
	}

	// check the user hasn't already signed up
	const user = await database.userSignedUp(guild_id, member_id)
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
		guild, member,
		query: req.query,
	});
}

function getGuildAndMember(guild_id, member_id) {
	const bot = getBot();
	return new Promise((resolve, reject) => {
		let guild = bot.guilds.get(guild_id);
		let member;
		if (guild) {
			member = guild.members.get(member_id);
		}
		resolve({ guild, member })
	})
}

async function checkNewUserPassword(req) {
	const pool = database.getDB();
	const passwordGiven = req.query.password || req.body.password;
	const member_id = req.query.member || req.body.member;
	const guild_id = req.query.guild || req.body.guild;
	let valid = false;
	let passwords = await pool.query(`
		SELECT password FROM pre_users WHERE member_id = '${member_id}' AND guild_id = '${guild_id}';
	`).catch(console.error);
	database.getFirst(passwords,
		(err, pass) => {
			valid = checkValidity(err, pass, passwordGiven)
		}
	)
	return valid;
}

async function postPasswordIsValid(req, res) {
	const valid = await checkNewUserPassword(req)
	res.status(valid ? 200 : 400).end()
}

function checkValidity(err, p, passwordGiven) {
	if (err) {
		console.log(err);
		return false;
	}
	return (p.password == passwordGiven)
}

async function post(req, res) {
	if (!await checkNewUserPassword(req)) {
		res.redirect('back');
		return;
	}
	if (req.body.nickname.length > 32) {
		let u = new url.URL(path.join(process.env.WEBSITE_URL, req.url));
		u.searchParams.set('nameerror', 'Too Long!')
		res.redirect(u);
		return;
	}
	const guild = getBot().guilds.get(req.query.guild)
	const taken = guild.members.some(member => member.displayName === req.body.nickname && member.id !== req.query.member)
	if (taken) {
		let u = new url.URL(path.join(process.env.WEBSITE_URL, req.url));
		u.searchParams.set('nameerror', 'Name Taken!')
		res.redirect(u);
		return;
	}
	const member = await guild.members.get(req.query.member);
	await member.setNickname(req.body.nickname).catch(err => {
		// bot cannot change an administrator's nickname, ignore this error.
		if (!err.message === "Missing Permissions") 
			console.error(err)
	});

	const salt = await bcrypt.genSalt(10);
	const passwordhash = await bcrypt.hash(req.body.newpassword, salt);

	req.session.user = {
		member_id: req.query.member,
		guild_id: req.query.guild,
		passwordhash: passwordhash,
		name: member.displayName
	}

	await save(req.session.user);
	res.redirect('/signup/timetable');
}

async function save(user) {
	const pool = database.getDB();

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
