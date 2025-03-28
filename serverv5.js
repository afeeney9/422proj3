const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// Hardcoded database credentials
const DB_USER = 'root';  // Replace with your database username
const DB_PASS = '422';   // Replace with your database password
const DB_NAME = 'project3';  // Replace with your database name
const DB_HOST = '127.0.0.1';  // Cloud SQL Proxy default address or the MySQL server address
const DB_PORT = 3306;  // Default MySQL port

// Google Cloud Storage configuration
const storage = new Storage({
  keyFilename: './key.json', // Replace with your service account key file path
});
const bucketName = 'proj3-bucket'; // Replace with your Google Cloud Storage bucket name
const bucket = storage.bucket(bucketName);

// Create a connection pool to the database
const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  port: DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Setup Multer for memory storage (no filesystem storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
  },
});

// API Route to Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting connection from pool:', err.stack);
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    connection.execute(query, [username, password], (err, results) => {
      connection.release();  // Release the connection back to the pool

      if (err) {
        console.error('Error executing query:', err);
        return res.status(500).json({ error: 'Query execution failed' });
      }

      if (results.length > 0) {
        return res.status(200).json({ message: 'Login successful', user: results[0] });
      } else {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    });
  });
});

// API Route to upload photo
app.post('/api/upload', upload.single('photo'), async (req, res) => {
  const userId = req.body.userId;  // The user ID should be sent along with the photo
  const file = req.file;

  if (!userId || !file) {
    return res.status(400).json({ error: 'User ID and photo are required' });
  }

  try {
    console.log("File found, attempting upload...");

    const blob = bucket.file(file.originalname);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: file.mimetype, // Use the MIME type of the uploaded file
      },
    });

    blobStream.on('finish', async () => {
      try {
        // After the upload is finished, make the file publicly accessible
        await blob.acl.add({
          entity: 'allUsers', // Grant public read access to anyone
          role: 'READER',
        });

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

        // Save the photo metadata in the database
        pool.getConnection((err, connection) => {
          if (err) {
            console.error('Error getting connection from pool:', err.stack);
            return res.status(500).json({ error: 'Database connection failed' });
          }

          const query = 'INSERT INTO photos (user_id, photo_url) VALUES (?, ?)';
          connection.execute(query, [userId, publicUrl], (err, results) => {
            connection.release();  // Release the connection back to the pool

            if (err) {
              console.error('Error saving photo to database:', err);
              return res.status(500).json({ error: 'Failed to save photo to database' });
            }

            return res.status(200).json({ message: 'Photo uploaded successfully', photoUrl: publicUrl });
          });
        });

        console.log("File uploaded successfully!");
      } catch (error) {
        console.error("Error during upload:", error);
        res.status(500).send("Error setting ACL or saving file.");
      }
    });

    blobStream.on('error', (error) => {
      console.error("Error during upload:", error);
      res.status(500).send(error);
    });

    // Write the file buffer to the stream
    blobStream.end(file.buffer);
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ error: 'Failed to upload photo to Cloud Storage' });
  }
});

// API Route to fetch user photos
app.get('/api/photos', (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting connection from pool:', err.stack);
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const query = 'SELECT * FROM photos WHERE user_id = ?';
    connection.execute(query, [userId], (err, results) => {
      connection.release();  // Release the connection back to the pool

      if (err) {
        console.error('Error fetching photos:', err);
        return res.status(500).json({ error: 'Failed to fetch photos' });
      }

      return res.status(200).json({ photos: results });
    });
  });
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
