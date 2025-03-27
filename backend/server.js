require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('@google-cloud/sql');


const app = express();
app.use(express.json());
app.use(cors());

const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;
const DB_NAME = process.env.DB_NAME;
const SQLSERVER_CONNECTION_NAME = process.env.SQLSERVER_CONNECTION_NAME;


// API Route to Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const pool = new Pool({
        connectionName: process.env.SQLSERVER_CONNECTION_NAME,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
    });

    await pool.connect(async (err, client) => {
        if (err) {
            console.error('Error connecting to Cloud SQL:', err);
            return;
        }

        try {
            const result = await client.query('SELECT * FROM users WHERE username = ${username} AND password = ${password}');
            console.log('Query result:', result);
        } catch (err) {
            console.error('Error executing query:', err);
        } finally {
            client.release();
        }
    });

});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
