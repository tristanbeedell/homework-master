module.exports = { getForm, login, validate }

const discord = require('../modules/discord')
const members = require('../modules/member')
const { getDB } = require('../modules/database')
const bcrypt = require('bcrypt');

function getForm(req, res) {
	res.render('pages/login', {
		session: req.session,
		bot: discord.getBot(),
		query: req.query
	});
}

async function login(req, res) {
	let member = await members.get(req.body.guild, req.body.name)
	let valid = await validatePassword(member, req.body.password).catch(console.error)
	if (!valid) {
		res.status(403).end()
		return
	}
	// query database for the   member
	let pool = getDB()
	pool.query(`
    SELECT 	groups.school_name AS name,
						groups.year        AS year,
						groups.guild_id    AS guild_id,
						users.member_id    AS member_id
					FROM users
  	INNER JOIN groups ON users.group_id = groups.id
  	WHERE users.member_id = '${member.id}' AND groups.guild_id = '${member.guild.id}';
  `).then(user => {
		// store the user in the browser session
		req.session.user = user.rows[0];
		req.session.user.name = member.displayName
		res.redirect("/")
	})
}

async function validatePassword(member, password) {
	if (!member) { return false }
	// query database for the password ofthe member
	let pool = getDB()
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
	if (!valid) { res.status(400).send('Username or Password are incorrect'); return }
	res.end()
}
