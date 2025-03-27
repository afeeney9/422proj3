require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('@google-cloud/sql');
const {AWS } = require('aws-sdk');
const {fs} = require('fs');


const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
    connectionName: process.env.SQLSERVER_CONNECTION_NAME,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
});

// API Route to Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const query = 'SELECT * FROM users WHERE username = $1 AND password = $2';
        const { rows } = await pool.query(query, [username, password]);

        if (rows.length > 0) {
            return res.status(200).json({ message: 'Login successful', user: rows[0] });
        } else {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Error executing query:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/search', async(req, res) => {
    const {username, searchTerms} = req.body;

    if (!username || !searchTerms) {
        return res.status(400).json({error: 'Username and search terms are required'});
    }

    try {
        const query = 'SELECT * FROM photos WHERE username = $1 AND title CONTAINS $2';
        const {rows} = await pool.query(query, [username, searchTerms]);

        return res.status(200).json({message: 'Query successful', photos: rows});

    } catch (error) {
        console.error('Error executing query:', error);
        return res.status(500).json({error: 'Internal server error'});

    }
});

app.get('/api/photos', async(req, res) => {
    const { username } = req.body;

    if(!username){
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        const query = 'SELECT * FROM photos WHERE username = $1';
        const { rows } = await pool.query(query, [username]);

        return res.status(200).json({ message: 'Query successful', photos: rows });

    } catch (error) {
        console.error('Error executing query:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


app.post('/api/upload', async(req, res) => {
    const { username, title, tags, description, image} = req.body;

    if(!username || !title || !image){
        return res.status(400).json({ error: 'Username is required' });
    }

    const s3 = new AWS.S3({
        apiVersion: '2006-03-01',
        region: process.env.REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY,
            secretAccessKey: process.env.AWS_SECRET_KEY
        }
    });
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: title,
        Body: image
    };
    try {
        s3.upload(params, (err, data) => {
            if (err) {
                console.error("Error uploading file:", err);
                return res.status(500).json({error: 'Can not post to AWS bucket'});
            } else {
                console.log("File uploaded successfully:", data);

            }
        });
    }catch(error) {
        return res.status(500).json({error: 'Can not post to AWS bucket'});
    }
    const imageUrl = "http://" + process.env.BUCKET_NAME + ".s3.us-east-2.amazonaws.com/" + title

    try {
        const query = 'INSERT INTO photos (title, description, tags, imageUrl, username) VALUES ($1, $2, $3, $4, $5)';
        const { rows } = await pool.query(query, [title, description, tags, imageUrl, username]);

        return res.status(200).json({ message: 'Query successful', photos: rows });

    } catch (error) {
        console.error('Error executing query:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
