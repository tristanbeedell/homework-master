const fs = require('fs');
const path = require('path');

let commands = [];

let startPath = path.join(__dirname, './commands');
let files = fs.readdirSync(startPath);
for (let file of files) {
	let filename = path.join(startPath, file);
	commands.push(require(filename));
}

module.exports = commands;
