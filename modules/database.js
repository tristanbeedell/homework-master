module.exports = { initDB, getDB, getFirst, userSignedUp }

const { Pool } = require("pg");
const assert = require('assert');
const colors = require('colors');
let pool;

function initDB() {
	if (pool) {
		console.warn('already connected to db'.red)
	}
	// connect to database through an ssl connection
	pool = new Pool({
		connectionString: process.env.DATABASE_URL,
		ssl: true
	});
	// handle any errors
	pool.on('error', (err) => {
		console.error('An idle client has experienced an error'.red, err.stack)
	});
	console.log('connected to the database'.yellow)
}

function getDB() {
	assert.ok(pool, "pool is not connected".red);
	return pool;
}

function getFirst(dbRes, callback) {
	let first;
	let err;
	// if one and only one is found
	if (dbRes.rowCount == 1) {
		first = dbRes.rows[0]
	} else {
		err = `error: db query returned ${dbRes.rowCount} rows`.red
	}
	callback(err, first);
}


async function userSignedUp(guild_id, member_id) {
	let signedUpUser = await pool.query(`
		SELECT complete FROM users WHERE id = user_id('${member_id}', '${guild_id}');
	`).catch(console.error)
	return { exists: signedUpUser.rowCount == 1, complete: signedUpUser.rowCount == 1 && signedUpUser.rows[0].complete }
}
