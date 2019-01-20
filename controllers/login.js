module.exports = { getForm, login, validate }

const path = require('path');
const discord = require(path.join(__dirname, '../modules/discord'));
const members = require(path.join(__dirname, '../modules/member'));
const { getDB } = require(path.join(__dirname, '../modules/database'));
const bcrypt = require('bcrypt');

function getForm(req, res, wrong = 'none') {
	res.render('pages/login', {
		...req,
		bot: discord.getBot(),
		wrong
	});
}

async function login(req, res) {
	const bot = discord.getBot();
	const guild = bot.guilds.get(req.body.guild);
	if (!guild) {
		getForm(req, res, 'guild');
		return;
	}
	let member = guild.members.find(member => member.displayName === req.body.name || member.user.tag === req.body.name);
	if (!member) {
		getForm(req, res, 'name');
		return;
	}
	let valid = await validatePassword(member, req.body.password).catch(console.error);
	if (!valid) {
		getForm(req, res, 'pass');
		return;
	}
	// query database for the member
	const pool = getDB();
	pool.query(`
		SELECT 	
			groups.school_name AS name,
			groups.year        AS year,
			groups.guild_id    AS guild_id,
			users.member_id    AS member_id
		FROM users
		INNER JOIN groups ON users.group_id = groups.id
		WHERE users.member_id = '${member.id}' AND groups.guild_id = '${member.guild.id}';
	`).then(user => {
		// store the user in the browser session
		req.session.user = user.rows[0];
		res.redirect(req.query.redirect || "/")
	})
}

async function validatePassword(member, password) {
	if (!member.id || !member.guild.id) { return false }
	// query database for the password ofthe member
	const pool = getDB()
	passwords = await pool.query(`
		SELECT users.passwordhash FROM users
		INNER JOIN groups ON users.group_id = groups.id
		WHERE users.member_id = '${member.id}' AND groups.guild_id = '${member.guild.id}';
	`)
		.catch(console.error)
	// compare given pass with hash stored in the database
	return bcrypt.compare(password, passwords.rows[0].passwordhash);
}

async function validate(req, res) {
	let member = await members.get(req.body.guild, req.body.name)
	let valid = await validatePassword(member, req.body.password)
		.catch(console.error)
	if (!valid) { res.status(401).send('Username or Password are incorrect'); return }
	res.end()
}
