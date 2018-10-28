module.exports = { giveClasses, getTimetable, getTimetableForm }

const { getDB } = require('../modules/database');
const discord = require('../modules/discordFunctions');
const giveRoles = require('../modules/createClass');

async function getTimetableForm(req, res) {
	let pool = getDB();
	// ensure that the user has signed up
	if (!req.session.user) {
		res.redirect('back')
		return;
	}
	// get the sets and their divisions
	let sets = await pool.query(`
    SELECT	DISTINCT
      sets.set 	        AS name,
    	divisions.name 		AS division,
    	teachers.name 		AS teacher,
    	sets.name  		    AS subject
    FROM sets
    INNER JOIN divisions 	ON divisions.id = sets.division_id
    INNER JOIN groups		  ON divisions.group_id = groups.id
    INNER JOIN timetable	ON sets.id = timetable.set_id
    LEFT JOIN  teachers		ON timetable.teacher_id = teachers.id
    WHERE groups.guild_id = '${req.session.user.guild_id}' AND timetable.usual
    ORDER BY division DESC;
  `)
	// render page with
	res.render("pages/timetable", {
		subjects: sets.rows,
		guild: req.session.user.guild_id,
		member: req.session.user.member_id,
	});
}


function getTimetable(req, res) {
	let pool = getDB()
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
	let pool = getDB();
	// store the user in their session
	req.session.user = Object.assign(req.session.user, req.body);
	let member = discord.getDiscordMember(req.session.user.guild_id, req.session.user.member_id);
	// give the user access to their classes.
	await giveRoles(member, req.body.classes);
	// save new user's classes to database
	await saveClasses(req.session.user);
	// remove the pre-user
	pool.query(`DELETE FROM pre_users
    WHERE member_id = '${req.session.user.member_id}'
    AND guild_id = '${req.session.user.guild_id}';
  `).catch(console.error);

	member.send("All done! If you want me again then type `!help` in the server");
	let guild = member.guild;
	// res.redirect(`/guilds/${guild.name}/members/${discord.getName(member)}`.replace(/ /g, '_'));
	res.redirect(`/`);
}

function saveClasses(user) {
	let pool = getDB();
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
	query = query.slice(0, -1) + ';'
	return pool.query(query).catch(console.error)
}
