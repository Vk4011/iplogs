const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

const logFilePath = path.join(__dirname, 'ip_logs.txt');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to log IP addresses and count visits
const ipVisits = {};

app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const timestamp = new Date().toISOString();

    // Track IP visits
    if (!ipVisits[ip]) {
        ipVisits[ip] = { count: 1, lastVisit: timestamp };
    } else {
        ipVisits[ip].count += 1;
        ipVisits[ip].lastVisit = timestamp;
    }

    // Log the IP visit to the file
    const logMessage = `IP: ${ip}, Time: ${timestamp}, Visits: ${ipVisits[ip].count}\n`;

    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) {
            console.error('Error writing to log file', err);
        }
    });

    next();
});

// Route to serve IP logs
app.get('/api/iplogs', (req, res) => {
    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading log file' });
        }

        const logs = data.split('\n').filter(log => log.trim() !== '');
        res.json(logs);
    });
});

// Route to serve IP data (how many times visited and last visit time)
app.get('/api/logdata', (req, res) => {
    const logData = Object.keys(ipVisits).map(ip => ({
        ip,
        lastVisit: ipVisits[ip].lastVisit,
        visits: ipVisits[ip].count
    }));

    let htmlContent = `
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>IP Log Data</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body {
          background-color: #1d1f22; /* Dark background */
          color: #ffffff; /* White text */
          font-family: 'Arial', sans-serif;
        }
        .container {
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          border-radius: 8px;
          background-color: #2d3748; /* Darker container background */
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .log-entry {
          border-bottom: 1px solid #93c5fd;
          padding: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="container bg-gradient-to-r from-slate-900 to-slate-700">
        <h1 class="text-4xl font-bold mb-6">IP Log Data</h1>
        <div id="logDataContainer">
    `;

    if (logData.length === 0) {
        htmlContent += `<p>No log data available.</p>`;
    } else {
        logData.forEach(log => {
            htmlContent += `
            <div class="log-entry">
              <p><strong>IP:</strong> ${log.ip}</p>
              <p><strong>Last Visit:</strong> ${log.lastVisit}</p>
              <p><strong>Number of Visits:</strong> ${log.visits}</p>
            </div>`;
        });
    }

    htmlContent += `
        </div>
      </div>
    </body>
    </html>
    `;

    res.send(htmlContent);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n\t Server running on port ${PORT} \n`);
});
