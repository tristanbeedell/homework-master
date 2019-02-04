module.exports = function send(content, msg, dest) {
	return new Promise((resolve) => {
		if (dest) {
			return dest.send(content).then((message) => {
				msg.react('✅');
				resolve(message);
			});
		} else {
			resolve(msg.reply(content));
		}
	});
};