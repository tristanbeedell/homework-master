module.exports = { giveClasses, getTimetableForm };

const path = require('path');
const { getDB } = require(path.join(__dirname, '../modules/database'));
const giveRoles = require(path.join(__dirname, '../bot/createClass'));

async function getTimetableForm(req, res) {
	const pool = getDB();
	// ensure that the user is signed in
	if (!req.member) 
		return res.redirect('/login?redirect=/signup/timetable');
	
	const user = await pool.query(`
		SELECT * FROM users
		WHERE id = user_id('${req.member.id}', '${req.member.guild.id}');
	`).catch(console.error);

	if (user.rowCount === 0)
		return res.redirect('/me');
	
	pool.query(`
		SELECT	DISTINCT
			sets.set			AS set,
			divisions.name 		AS division,
			sets.name		    AS name,
			timetable.day,
			timetable.period,
			subject.name		AS subject,
			teachers.name		AS teacher
		FROM sets
		INNER JOIN divisions 	ON divisions.id = sets.division_id
		INNER JOIN groups		ON divisions.group_id = groups.id
		INNER JOIN timetable	ON sets.id = timetable.set_id
		INNER JOIN subject		ON timetable.subject_id = subject.id
		LEFT JOIN teachers		ON timetable.teacher_id = teachers.id
		WHERE groups.guild_id = '${req.member.guild.id}'
		ORDER BY division DESC;
	`)
	.then((sets) => {
		// render page
		res.render("pages/timetable", {
			...req,
			rows: sets.rows
		});
	}).catch((err) => {
		console.error(err);
		res.status(500).end();
	});
}

async function giveClasses(req, res) {

	if (!req.session.user || !req.member) 
		return res.status(400).end();
	
	empty(req);

	// save new user's classes to database
	await saveClasses(req.session.user, req.body);

	res.redirect('/me');

	// give the user access to their classes.
	await giveRoles(req.member, req.body);

	// DM the user on discord
	req.member.send(`All done! 
You should now be in ${Object.values(req.body).join(', ')}. 
If you want me again then type \`help\``);
}

async function saveClasses(user, classes) {
	const pool = getDB();
	// update the user's classes in the DB
	let query = `
		INSERT INTO usr_set_join
		VALUES`;
	let classCount = 1; // to pass untrusted data into DB
	for (let division in classes) {
		if (classes[division] !== 'none') {
			query += `
		(user_id('${user.member_id}', '${user.guild_id}'),
		set_id($${classCount}, '${user.guild_id}')),`;
		classCount++;
		}
	}
	// remove trailing comma
	query = query.slice(0, -1) + ';';
	// query the DB.
	await pool.query(query, Object.values(classes)).catch(console.error);
	// The user is fully signed up.
	return pool.query(`
		UPDATE users 
		SET complete = TRUE 
		WHERE id = user_id('${user.member_id}', '${user.guild_id}');
	`);
}

async function empty(req) {
	const pool = getDB();
	const roles = await pool.query(`
		SELECT role_id FROM sets
		INNER JOIN usr_set_join ON sets.id = usr_set_join.set_id
		INNER JOIN users ON users.id = usr_set_join.user_id
		WHERE users.member_id = '${req.member.id}';
	`);
	await req.member.removeRoles(roles.rows.map(row => row.role_id));

	await pool.query(`
		DELETE FROM usr_set_join WHERE user_id = user_id('${req.member.id}', '${req.member.guild.id}');
	`);
	await pool.query(`
		UPDATE users SET complete = FALSE WHERE id = user_id('${req.member.id}', '${req.member.guild.id}');
	`);
}
