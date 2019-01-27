module.exports = get;

const path = require('path');
const { getBot } = require(path.join(__dirname, '../modules/discord'));
const { getDB } = require(path.join(__dirname, '../modules/database'));
const { markdown } = require('markdown');

async function get(req, res) {
	const bot = getBot();
	const pool = getDB();
	
	// if the guild does not exist, return a 404 error
	function unavaliable(message) {
		res.status(404).render("pages/unavaliable", {
			...req,
			bot,
			redirect: req.url,
			message
		});
	}

	// if the user is not logged into an account in this guild, send an unauthorised error
	if (!req.member) {
		unavaliable('Not logged in.');
		return;
	}
	
	const guild = bot.guilds.find(guild => guild.name.replace(/ /g, '_') === req.params.guildName.replace(/ /g, '_'));
	if (!guild) {
		unavaliable(`Guild '${req.params.guildName.replace(/_/g, ' ')}' not found.`);
		return;
	}
	const user = guild.members.find(member => member.displayName.replace(/_/g, '_') === req.params.memberName.replace(/_/g, ' '));
	if (!user) {
		unavaliable(`Member '${req.params.memberName.replace(/_/g, ' ')}' was not found in '${req.params.guildName.replace(/_/g, ' ')}'.`);
		return;
	}

	const userData = await pool.query(`
	SELECT DISTINCT
		sets.set	AS set,
		divisions.name	AS division,
		sets.name	AS name,
		timetable.day,
		timetable.period,
		subject.name	AS subject,
		teachers.name	AS teacher,
		users.complete,
		users.bio
	FROM sets
	INNER JOIN divisions	ON divisions.id = sets.division_id
	INNER JOIN groups	ON divisions.group_id = groups.id
	INNER JOIN timetable	ON sets.id = timetable.set_id
	INNER JOIN subject	ON timetable.subject_id = subject.id
	INNER JOIN usr_set_join ON usr_set_join.set_id = sets.id
	INNER JOIN users		ON usr_set_join.user_id = users.id
	LEFT JOIN teachers	ON timetable.teacher_id = teachers.id
		WHERE users.id = user_id('${user.id}', '${user.guild.id}');
	`);
	if (userData.rowCount < 1) {
		unavaliable(`Member '${user.displayName}' hasn't made an account yet.`);
		return;
	}
	userData.rows[0].bio = userData.rows[0].bio ? markdown.toHTML(userData.rows[0].bio) : false;

	res.render("pages/profile", {
		...req,
		bot,
		userData,
		user
	});
}
