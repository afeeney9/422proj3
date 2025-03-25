const mysql = require('mysql2/promise'); // Using mysql2/promise for promise-based connection

// These should ideally be in a .env file, but for testing, hardcoding is fine
// In your login.js these will be global.
const DB_USER = "root";
const DB_PASSWORD = "422";
const DB_DATABASE = "project3";

// Getting DB configuration from environment variables
const config = {
  socketPath: `/cloudsql/tribal-pillar-452919:us-central1:project3`, // Use Cloud SQL Unix socket path for connecting to Cloud SQL. Corrected key name.
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  port: 3306, // Removed port as it's not needed when using socketPath
};

// Connect to the MySQL database using the mysql2/promise library
(async () => {
  let pool;
  try {
    // Create a pool connection
    pool = mysql.createPool(config);

    // Test the connection
    const connection = await pool.getConnection();

    console.log('Connected to the MySQL database!');

    // Perform a sample query (you can replace this with your actual queries)
    const [results, fields] = await connection.query('SELECT NOW()');
    console.log('Query result:', results);

    connection.release(); // Release the connection back to the pool

    pool.end();//close pool
  } catch (error) {
    console.error('Error setting up or using connection:', error);
  } finally {
    if (pool) {
      pool.end();//close pool if fails
    }
  }
})();
