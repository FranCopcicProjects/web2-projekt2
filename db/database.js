const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const sqlPool = new Pool({
    connectionString: process.env.DATABASE_READONLY_URL
});

module.exports = { pool, sqlPool };