module.exports = { giveClasses, getTimetable, getTimetableForm }

const path = require('path');
const { getDB } = require(path.join(__dirname, '../modules/database'));
const members = require(path.join(__dirname, '../modules/member'));
const giveRoles = require(path.join(__dirname, '../bot/createClass'));

async function getTimetableForm(req, res) {
	const pool = getDB();
	// ensure that the user is signed in
	if (!req.session.user) 
		return res.redirect('/login?redirect=/signup/timetable');
	
	const user = await pool.query(`
		SELECT * FROM users
		WHERE member_id = '${req.session.user.member_id}'
		AND group_id('${req.session.user.guild_id}') = group_id
		AND complete = FALSE;
	`).catch(console.error);

	if (user.rowCount == 0)
		return res.redirect('/');

	// get the sets and their divisions
	const sets = await pool.query(`
		SELECT	DISTINCT
			sets.set 	        AS name,
			divisions.name 		AS division,
			teachers.name 		AS teacher,
			sets.name  		    AS subject
		FROM sets
		INNER JOIN divisions 	ON divisions.id = sets.division_id
		INNER JOIN groups		ON divisions.group_id = groups.id
		INNER JOIN timetable	ON sets.id = timetable.set_id
		LEFT JOIN  teachers		ON timetable.teacher_id = teachers.id
		WHERE groups.guild_id = '${req.session.user.guild_id}' AND timetable.usual
		ORDER BY division DESC;
	`).catch(console.error);
	// render page with
	res.render("pages/timetable", {
		subjects: sets.rows,
		guild: req.session.user.guild_id,
		member: req.session.user.member_id,
	});
}


function getTimetable(req, res) {
	// if the user isn't logged in, they cannot see the timetable data
	if (!req.session.user) 
		return res.status(403).end();

	const pool = getDB();
	pool.query(`
		SELECT
			timetable.teacher,
			timetable.period,
			timetable.day,
			timetable.class,
			timetable.division,
			override.name      AS override
		FROM divisions AS override
		RIGHT JOIN (
			SELECT
			teachers.name     AS teacher,
			timetable.period,
			timetable.day,
			subject.name      AS class,
			divisions.name    AS division,
			sets.overrides    AS overrides
		FROM timetable
		LEFT JOIN teachers  	ON teachers.id = timetable.teacher_id
		INNER JOIN sets 	 		ON sets.id = timetable.set_id
		INNER JOIN subject 	 	ON timetable.subject_id = subject.id
		INNER JOIN divisions 	ON sets.division_id = divisions.id
		INNER JOIN groups 		ON divisions.group_id = groups.id
			WHERE sets.set  = '${req.query.set}' AND
			divisions.name  = '${req.query.sub}' AND
			groups.guild_id = '${req.session.user.guild_id}') AS timetable
		ON timetable.overrides = override.id;`)
		.then((responce) => {
			res.json(responce)
		})
		.catch(console.error);
}


async function giveClasses(req, res) {

	if (!req.session.user) 
		return res.status(400).end();

	res.redirect('/me');

	const pool = getDB();
	// store the user in their session
	req.session.user = Object.assign(req.session.user, req.body);
	const member = members.get(req.session.user.guild_id, req.session.user.member_id);
	// save new user's classes to database
	await saveClasses(req.session.user);
	// give the user access to their classes.
	await giveRoles(member, req.body.classes);
	// DM the user on discord
	member.send("All done! If you want me again then type `help`");
}

async function saveClasses(user) {
	const pool = getDB();
	// update the user's classes in the DB
	let query = `
		INSERT INTO usr_set_join
		VALUES`
	for (let division in user.classes) {
		if (user.classes[division] != 'none') {
			query += `
      (user_id('${user.member_id}', '${user.guild_id}'),
      set_id('${user.classes[division]}')),`
		}
	}
	// remove trailing comma
	query = query.slice(0, -1) + ';'
	// query the DB.
	await pool.query(query).catch(console.error);
	// The user is fully signed up.
	return pool.query(`
		UPDATE users 
		SET complete = TRUE 
		WHERE id = user_id('${user.member_id}', '${user.guild_id}');
	`);
}
