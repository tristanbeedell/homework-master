module.exports = { join }

const path = require('path');
const { getBot } = require(path.join(__dirname, "../modules/discord"))
const { getDB, getFirst } = require(path.join(__dirname, "../modules/database"))
const bcrypt = require('bcrypt')
let bot;
let pool;

async function join(req, res) {
	pool = getDB()
	// get the group selected
	groups = await pool.query(`
		SELECT * FROM groups WHERE guild_id = '${req.body.guild}';
	`)
	getFirst(groups, async (err, group) => {
		if (err) {
			console.log(err)
			res.redirect('/join?chosenguild=false')
		} else {
			valid = await bcrypt.compare(req.body.pin, group.pin_hash)
			if (!valid) {
				res.redirect('/join?validpin=false&choice=' + req.body.guild)
			} else {
				createInvite(group, (invite) => {
					storeInvite(invite, req, res)
				})
			}
		}
	})
}

function storeInvite(invite, req, res) {
	req.session.invite = { url: invite.url };
	req.session.guild = {
		name: invite.guild.name
	}
	res.redirect('/invite');
}

function createInvite(group, callback) {
	bot = getBot()
	let guild = bot.guilds.get(group.guild_id)
	let inviteChannel = guild.channels.find(channel => {
		return channel.name == 'new-members'
	})
	inviteChannel.createInvite({ maxAge: 300, maxUses: 1 })
		.then(callback)
}
