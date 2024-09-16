const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to log IP addresses
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const timestamp = new Date().toISOString();
    
    const logMessage = `IP: ${ip} visited at ${timestamp}\n`;

    // Log IP to the console
    console.log(logMessage);

    // Append the log message to a file
    fs.appendFile(path.join(__dirname, 'ip_logs.txt'), logMessage, (err) => {
        if (err) {
            console.error('Error writing to log file', err);
        }
    });

    next();
});

// Serve the IP logs data as JSON
app.get('/api/iplogs', (req, res) => {
    const logFilePath = path.join(__dirname, 'ip_logs.txt');
    
    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading log file' });
        }
        
        const logs = data.split('\n').filter(log => log.trim() !== ''); // Filter out empty lines
        res.json(logs);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
