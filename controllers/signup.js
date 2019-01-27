module.exports = { get, postPasswordIsValid, post };

const path = require('path');
const url = require('url');
const { getBot } = require(path.join(__dirname, "../modules/discord"));
const members = require(path.join(__dirname, "../modules/member"));
const database = require(path.join(__dirname, "../modules/database"));
const bcrypt = require('bcrypt');

// FEATURE: get fullname and display name.

async function get(req, res) {
	const pool = database.getDB();

	// get the member and the guild from discord to check they exist
	const memberId = req.query.member;
	const guildId = req.query.guild;
	const member = await members.get(guildId, memberId);
	if (member.error){
		res.status(404).render('pages/unavaliable', {
			message: member.error,
			...req,
			redirect: req.url
		});
		return;
	}

	// check the user hasn't already signed up
	const user = await database.userSignedUp(guildId, memberId);
	if (user.exists && user.complete) {
		res.redirect(`/guilds/${encodeURIComponent(member.guild.name)}/members/${encodeURIComponent(member.displayName)}`.replace(/%20/g, '_'));
		return;
	} else if (user.exists && !user.complete && req.session.user) {
		res.redirect('/signup/timetable');
		return;
	} else if (user.exists && !user.complete && !req.session.user) {
		res.redirect(`/login?redirect=/signup/timetable`);
		return;
	}

	// check the user has been initialised
	const preuser = await pool.query(`
		SELECT * FROM pre_users
		WHERE member_id = '${memberId}'
		AND guild_id = '${guildId}'
	`).catch(console.error);

	if (preuser.rowCount < 1) {
		res.status(403).render('pages/unavaliable', {
			...req,
			message: 'This discord account hasn\'t been verified over DM.',
			redirect: req.url
		});
		return;
	}

	const valid = await checkNewUserPassword(req);
	if (!valid) {
		res.status(403).render('pages/unavaliable', {
			...req,
			message: 'You must follow the signup link DM\'d to you',
			redirect: req.url
		});
		return;
	}

	// render page
	res.render("pages/sign_up", {
		...req,
		member
	});
}

async function checkNewUserPassword(req) {
	const pool = database.getDB();
	const passwordGiven = req.query.password || req.body.password;
	const memberId = req.query.member || req.body.member;
	const guildId = req.query.guild || req.body.guild;
	let valid = false;
	let passwords = await pool.query(`
		SELECT password FROM pre_users WHERE member_id = '${memberId}' AND guild_id = '${guildId}';
	`).catch(console.error);
	database.getFirst(passwords,
		(err, pass) => {
			valid = checkValidity(err, pass, passwordGiven);
		}
	);
	return valid;
}

async function postPasswordIsValid(req, res) {
	const valid = await checkNewUserPassword(req);
	res.status(valid ? 200 : 400).end();
}

function checkValidity(err, p, passwordGiven) {
	if (err) {
		console.log(err);
		return false;
	}
	return (p.password === passwordGiven);
}

async function post(req, res) {
	if (!await checkNewUserPassword(req)) {
		res.redirect('back');
		return;
	}
	if (req.body.nickname.length > 32) {
		let u = new url.URL(path.join(process.env.WEBSITE_URL, req.url));
		u.searchParams.set('nameerror', 'Too Long!');
		res.redirect(u);
		return;
	}
	const guild = getBot().guilds.get(req.query.guild);
	const taken = guild.members.some(member => member.displayName.replace(/_/g, ' ') === req.body.nickname.replace(/_/g, ' ') && member.id !== req.query.member);
	if (taken) {
		let u = new url.URL(path.join(process.env.WEBSITE_URL, req.url));
		u.searchParams.set('nameerror', 'Name Taken!');
		res.redirect(u);
		return;
	}
	const member = await guild.members.get(req.query.member);
	await member.setNickname(req.body.nickname).catch(err => {
		// bot cannot change an administrator's nickname, ignore this error.
		if (!err.message === "Missing Permissions") 
			console.error(err);
	});

	const salt = await bcrypt.genSalt(10);
	const passwordhash = await bcrypt.hash(req.body.newpassword, salt);

	req.session.user = {
		memberId: req.query.member,
		guildId: req.query.guild,
		passwordhash: passwordhash,
		name: member.displayName
	};

	await save(req.session.user);
	res.redirect('/signup/timetable');
}

async function save(user) {
	const pool = database.getDB();

	// Add the new user with their own password.
	await pool.query(`
		INSERT INTO users (member_id, group_id, passwordhash)
		VALUES ('${user.memberId}', group_id('${user.guildId}'), '${user.passwordhash}')
	`).catch(console.error);

	// remove the pre-user.
	return pool.query(`
		DELETE FROM pre_users
		WHERE member_id = '${user.memberId}'
		AND guild_id = '${user.guildId}';
	`).catch(console.error);
}
