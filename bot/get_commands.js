const fs = require('fs');
const path = require('path');


module.exports = () => {
	let commands = [];

	let startPath = path.join(__dirname, './commands');
	let files = fs.readdirSync(startPath);
	for (let file of files) {
		let filename = path.join(startPath, file);
		commands.push(require(filename));
	}
	return commands;	
};
