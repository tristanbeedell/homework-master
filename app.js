#!/usr/bin/env nodejs

console.log('Importing Dependencies...');
// dependencies
const express = require('express'); // for webpage server
const path = require('path'); // a neater way to join paths
const bodyParser = require('body-parser'); // needed for request body on post requests
const session = require('express-session'); // for sessions
const helmet = require('helmet'); // security headers
require('dotenv').config(); // environment variables

// create the app
const app = express();

console.log('Loading Middleware...');
// load all the middleware
app.use(helmet()); // security headers
app.use(bodyParser.urlencoded({ extended: true })); // post body parser
app.use(bodyParser.json()); //post json parser
app.set('view engine', 'ejs'); // use embedded javascript html templates
app.set('views', path.join(__dirname, 'views')); // view template directory
app.use(express.static('favicon_package_v0.16')); // static favicons
app.use(express.static('public')); // static code
app.use(session({
	secret: process.env.SESSION_SECRET || 'secret', // this must be secret
	name: 'session-id',
	resave: true,
	saveUninitialized: true,
	cookie: {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production' // use ssl in production
	}
}));

// my middleware
app.use(require(path.join(__dirname, './middleware/userExists'))); // for getting discord interactions on webpage
app.use(require(path.join(__dirname, './middleware/logger'))); // for logging requests

// my modules for connecting to apis
const { initBot, getBot } = require(path.join(__dirname, './modules/discord'));
const { initDB } = require(path.join(__dirname, './modules/database'));

// my controllers
const signup = require(path.join(__dirname, './controllers/signup'));
const timetable = require(path.join(__dirname, './controllers/timetable'));
const profile = require(path.join(__dirname, './controllers/profile'));
const myProfile = require(path.join(__dirname, './controllers/my_profile'));
const guild = require(path.join(__dirname, './controllers/guild'));
const login = require(path.join(__dirname, './controllers/login'));

console.log('Connecting Controllers...');
app.get("/", (req, res) => {
	res.render("pages/home", {
		...req,
		bot: getBot()
	});
});
app.get("/help", (req, res) => {
	res.render("pages/help", {
		...req,
		bot: getBot()
	});
});
app.get("/help/bot", (req, res) => {
	res.render("pages/bot_help", {
		...req,
		bot: getBot()
	});
});
app.get("/logout", (req, res) => {
	delete req.session.user;
	delete req.member;
	res.redirect("back");
});
app.get('/join', (req, res) => {
	// if already invited, show the invite, else let the user join
	if (req.session.invite) {
		res.redirect('/invite');
	} else {
		res.render('pages/join', {
			...req,
			bot: getBot(),
			wrong: 'none'
		});
	}
});

app.post('/join', require('./controllers/join').join);
app.get('/invite', require('./controllers/invite').invite);

app.get('/signup', signup.get);
app.post('/signup', signup.post);

app.post('/checkNewUserPassword', signup.postPasswordIsValid);
app.get('/signup/timetable', timetable.getTimetableForm);
app.get('/timetabledata', timetable.getTimetable);
app.post('/timetable', timetable.giveClasses);

app.get('/guilds/:guildName/members/:memberName', profile);
app.get('/guilds/:guildName/', guild);

app.get('/me', myProfile.get);
app.delete('/me', myProfile.del);
app.post('/me', myProfile.post);

app.get('/login', login.getForm);
app.post('/login', login.login);
app.post('/validateLogin', login.validate);
// TODO: rules and guidlines page.

const port = process.env.PORT || 8080;
// initialise bot and then database
initBot(() => {
	initDB();
	// run the bot
	require('./bot/index');
	// listen to the webpage
	app.listen(port);
	console.log(`Listening on port ${port}`);
});
