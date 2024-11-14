// server.js
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const fs = require('fs');
const app = express();
app.use(express.json()); // Parse JSON data
app.use(cors());

// Load credentials for the Google Sheets API
const credentials = JSON.parse(fs.readFileSync('credentials.json'));
const { client_email, private_key } = credentials;

// Initialize Google Sheets API
const auth = new google.auth.JWT(
  client_email,
  null,
  private_key,
  ['https://www.googleapis.com/auth/spreadsheets']
);
const sheets = google.sheets({ version: 'v4', auth });

// Replace with your Google Sheet ID
const SPREADSHEET_ID = '1O2VSultD5vDtwawjtly6D2SKeqvharLyYnxW0qYBNMo';

// Fetch data from Google Sheets with range parameter
app.get('/fetch-data', async (req, res) => {
  try {
    // Extract the range from the request query parameter
    const { range } = req.query;

    // Validate the range parameter (optional)
    // You can add logic to check if the range is in a valid format (e.g., "Sheet1!A1:B10")

    if (!range) {
      throw new Error('Missing range parameter');
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range, // Use the extracted range
    });
    res.json(response.data.values);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Update Google Sheets and fetch recalculated data
app.post('/update-data', async (req, res) => {
  const { cell, value } = req.body;

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Project Inputs!${cell}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [[value]] },
    });

    // Re-fetch recalculated values
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Project Inputs!A2:N17', // Range of recalculated cells
    });
    res.json(response.data.values);
  } catch (error) {
    console.error('Error updating data:', error);
    res.status(500).json({ error: 'Failed to update data' });
  }
});

// Start the server
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
