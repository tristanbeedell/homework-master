module.exports = createServer;
const fs = require('fs');
const https = require('https');
const http = require('http');

function createServer(app) {
	if (process.env.NODE_ENV == 'production') {
		var key = fs.readFileSync('/etc/letsencrypt/live/homework-master.co.uk/privkey.pem', 'utf8');
		var cert = fs.readFileSync('/etc/letsencrypt/live/homework-master.co.uk/fullchain.pem', 'utf8');
		var credentials = { key, cert };
		https.createServer(credentials, app).listen(443, "0.0.0.0")
		useSSL();
	} else {
		app.listen(8080)
	}
}

function useSSL() {
	http.createServer(function (req, res) {
		res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
		res.end();
	}).listen(80);
}
