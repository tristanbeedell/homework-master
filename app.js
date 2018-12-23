#!/usr/bin/env nodejs
// dependencies
const express = require("express"); // for webpage server
const path = require("path"); // a neater way to join paths apparently
const bodyParser = require("body-parser"); // needed for request body on post requests
const session = require("express-session"); // for sessions
const bcrypt = require("bcrypt"); // for password encryption
const colors = require('colors'); // pretty terminal output
require('dotenv').config() // environment variables
// setup the server
const app = express();
// load all the middleware
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());
app.use(express.static("views"));
app.use(express.static('public'));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("public", path.join(__dirname, "public"));
app.use(express.static('favicon_package_v0.16'));
app.use(session({
	secret: "keyboard cat",
	resave: true,
	saveUninitialized: true
}));
app.use(require('./middleware/userExists'))
app.use(require('./middleware/logger'))

// my modules
const { initBot, getBot } = require("./modules/discord")
const { initDB, getDB } = require('./modules/database')
const members = require("./modules/member")
const guilds = require("./modules/guild")

// my controllers
const signup = require('./controllers/signup')
const timetable = require('./controllers/timetable')
const profile = require('./controllers/profile')
const guild = require('./controllers/guild')
const login = require('./controllers/login')

app.get("/", (req, res) => {
	res.render("pages/home", {
		session: req.session,
		bot: getBot()
	});
});
app.get("/unavaliable", (req, res) => {
	res.render("pages/unavaliable", {
		session: req.session,
		bot: getBot()
	});
});
app.get("/help", (req, res) => {
	res.render("pages/help", {
		session: req.session,
		bot: getBot()
	});
});
app.get("/logout", (req, res) => {
	delete req.session.user;
	res.redirect("back");
});
app.get('/join', (req, res) => {
	// if already invited, show the invite, else let the user join
	if (req.session.invite) {
		res.redirect('/invite')
	} else {
		res.render('pages/join', {
			session: req.session,
			bot: getBot(),
			query: req.query
		});
	}
});

app.post('/join', require('./controllers/join').join)
app.get('/invite', require('./controllers/invite').invite)
app.get('/signup', signup.getSignup)
app.post('/checkNewUserPassword', signup.postPasswordIsValid)
app.post('/signup', signup.signup)
app.get('/signup/timetable', timetable.getTimetableForm)
app.get('/signup/timetabledata', timetable.getTimetable);
app.post('/signup/timetable', timetable.giveClasses);
app.get('/guilds/:guildName/members/:memberName', profile);
// TODO: guild profile
app.get('/guilds/:guildName/', guild);
app.get('/login', login.getForm)
app.post('/login', login.login)
app.post("/validateLogin", login.validate)

const port = process.env.PORT || 8080;
// initialise bot and then database
initBot(err => {
	initDB()
	// run the bot
	require('./bot/index');
	// listen to the webpage
	app.listen(port)
});
