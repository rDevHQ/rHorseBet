const express = require('express');
const fs = require('fs'); // File system module to save JSON to a file
const app = express();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Allow all origins
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // Allow specific methods
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200); // Respond to preflight request
    }
    next();
});

// Middleware to parse JSON requests
app.use(express.json());

// POST route to receive manipulated JSON
app.post('/save', (req, res) => {
    const jsonData = req.body; // JSON data sent from the client

    // Save the JSON to a file (e.g., manipulatedData.json)
    fs.writeFile('manipulatedData.json', JSON.stringify(jsonData, null, 2), (err) => {
        if (err) {
            console.error('Error saving JSON:', err);
            return res.status(500).send('Error saving JSON data');
        }
        console.log('JSON data successfully saved to manipulatedData.json');
        res.send('JSON data successfully saved');
    });
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});