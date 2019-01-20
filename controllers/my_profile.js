module.exports = { get, del, post };

const path = require('path');
const { getBot } = require(path.join(__dirname, '../modules/discord'));
const { getDB } = require(path.join(__dirname, '../modules/database'));

async function get(req, res) {
	const bot = getBot();
	const pool = getDB();
	
	// if the user is not logged in, redirect to login page
	if (!req.member) {
		res.redirect('/login?redirect=/me');
		return;
	}

	const userData = (await pool.query(`
		SELECT * FROM users WHERE id = user_id('${req.member.id}', '${req.member.guild.id}');
	`)).rows[0];

	res.render("pages/my_profile", {
		bot,
		userData,
		...req
	});
}

function del(req, res) {
	if (!req.session.user) {
		return res.status(400).send('user must be logged in order to delete');
	}
	const pool = getDB();
	// TODO: password verification on account deletion
	req.member.send(`**You have left ${guild.name}.**\nSorry to see you go! If you have any queries, or problems, feedback is appreciated. :v:`);
	pool.query(`SELECT id FROM users WHERE member_id = '${req.member.id}';`)
		.then(async user => {
			await pool.query(`DELETE FROM users WHERE id = ${user.rows[0].id};`).catch(console.error)
			await pool.query(`DELETE FROM usr_set_join WHERE user_id = ${user.rows[0].id};`).catch(console.error)
		})
		.catch(console.error);
	req.member.kick()
	delete req.session.user;
	res.redirect('/join');
}

async function post(req, res) {
	if (!req.member) {
		res.redirect('/login?redirect=/me');
		return;
	}
	const pool = getDB();
	if (req.body.bio) {
		req.body.bio = req.body.bio.slice(0, 500);
		await pool.query(`
			UPDATE users SET bio = $1
			WHERE users.id = user_id('${req.session.user.member_id}', '${req.session.user.guild_id}');
		`, [req.body.bio])
	}
	if (req.body.username) {
		const taken = req.member.guild.members.some(member => 
			member.displayName === req.body.username && member.id !== req.member.id);
		if (!taken) {
			await req.member.setNickname(req.body.username).catch(error => {
				if (error.message !== 'Missing Permissions')
					throw error
			});
		}
	}
	res.redirect('/me');
}
