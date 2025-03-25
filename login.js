DB_USER = "root";
DB_PASS = "422";
DB_NAME = "project3";
SQLSERVER_CONNECTION_NAME = "tribal-pillar-452919-v9:us-central1:project3";

const express = require('express');
const path = require('path');
const { Connection, Request } = require('tedious');
const { Connector } = require('@google-cloud/cloud-sql-connector');

const app = express();
const port = process.env.PORT || 4000;

// Middleware to parse URL-encoded and JSON request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files (like HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Cloud SQL connection setup using `tedious` and `@google-cloud/cloud-sql-connector`
const connector = new Connector();

const connectToDatabase = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      // Get the SQL Server connection options
      const clientOpts = await connector.getTediousOptions({
        instanceConnectionName: SQLSERVER_CONNECTION_NAME,
        ipType: 'PUBLIC', // You can change this to 'PRIVATE' if using private IP
      });

      // Create a new tedious connection using the options provided
      const connection = new Connection({
        // 'server' is a dummy value due to a bug in the tedious driver
        server: '0.0.0.0',
        authentication: {
          type: 'default',
          options: {
            userName: DB_USER,
            password: DB_PASS,
          },
        },
        options: {
          ...clientOpts,
          port: 1433,
          database: DB_NAME,
        },
      });

      connection.on('connect', (err) => {
        if (err) {
          console.error('Error connecting to database:', err);
          reject(err);
        } else {
          console.log('Connected to SQL Server!');
          resolve(connection);
        }
      });
      connection.connect();
    } catch (err) {
      console.error('Error setting up connection:', err);
      reject(err);
    }
  });
};

// Route to render login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Handle login POST request
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const connection = await connectToDatabase();

    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

    let result;

    const reqSql = new Request(query, (err) => {
      if (err) {
        console.error('Error executing query:', err);
        return res.status(500).send('Internal Server Error');
      }
    });

    reqSql.on('error', (err) => {
      console.error('SQL Request Error:', err);
      res.status(500).send('Internal Server Error');
    });

    reqSql.on('row', (columns) => {
      result = columns;
    });

    reqSql.on('requestCompleted', () => {
      if (result && result.length > 0) {
        //Assuming you have a session mechanism
        //req.session.user = result[0]; // Save user session
        res.redirect('/dashboard');
      } else {
        res.status(401).send('Invalid username or password');
      }
    });

    connection.execSql(reqSql);
  } catch (error) {
    console.error("Error in login route", error)
    res.status(500).send('Internal Server Error');
  }
});

// Route for the dashboard page (protected)
app.get('/dashboard', (req, res) => {
  //Assuming you have a session mechanism
  /*if (!req.session.user) {
    return res.redirect('/login'); // Redirect to login if not authenticated
  }*/
  res.send(`<h1>Welcome, user</h1><p>This is your dashboard.</p>`);
});

// Route for logging out
app.get('/logout', (req, res) => {
  //Assuming you have a session mechanism
  /*req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/login');
  });*/
  res.redirect('/login');
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
