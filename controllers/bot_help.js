module.exports = { get };

const path = require('path');
const getCommands = require(path.join(__dirname, '../bot/get_commands'));
const discord = require(path.join(__dirname, '../modules/discord'));

async function get (req, res) {
	let commands = await Promise.all(getCommands().slice(0)
		.map(async v => {
			// create a copy of the command
			const html = { ...v };
			// convert the docs to html
			html.instructions = await discord.toHTML(v.instructions);
			html.usage = await discord.toHTML(v.usage);
			html.summary = await discord.toHTML(v.summary);
			return html;
		}));

	res.render('pages/bot_help', {
		...req,
		commands,
		bot: discord.getBot()
	});
}
