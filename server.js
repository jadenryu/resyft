const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Configure multer for file uploads (store in memory)
const upload = multer({ storage: multer.memoryStorage() });

// Enable CORS and serve static files
app.use(cors());
app.use(express.static('public'));

// Serve index.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Endpoint to analyze existing document (demo.pdf)
app.post('/api/analyze-existing', async (req, res) => {
  try {
    const docPath = path.join(__dirname, 'demo.pdf');
    
    if (!fs.existsSync(docPath)) {
      return res.status(404).json({ error: 'demo.pdf not found' });
    }

    const fileBuffer = fs.readFileSync(docPath);
    console.log(`Analyzing existing document: demo.pdf (${fileBuffer.length} bytes)`);

    // Create form data to send to the PDF analysis service
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: 'demo.pdf',
      contentType: 'application/pdf'
    });
    
    // Always use fast=true for LightGBM models
    formData.append('fast', 'true');

    // Send request to PDF analysis service root endpoint
    const response = await fetch('http://localhost:5060/', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`PDF service returned status ${response.status}`);
    }

    const result = await response.json();
    
    console.log('Analysis complete');
    
    // Convert PDF to base64 for frontend display
    const pdfBase64 = fileBuffer.toString('base64');
    
    res.json({
      success: true,
      filename: 'demo.pdf',
      pdfData: pdfBase64,
      segments: result
    });

  } catch (error) {
    console.error('Error analyzing existing document:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint to analyze PDF (always uses LightGBM model)
app.post('/api/analyze', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    console.log(`Analyzing PDF: ${req.file.originalname} (${req.file.size} bytes)`);

    // Create form data to send to the PDF analysis service
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    // Always use fast=true for LightGBM models
    formData.append('fast', 'true');

    // Send request to PDF analysis service root endpoint
    const response = await fetch('http://localhost:5060/', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`PDF service returned status ${response.status}`);
    }

    const result = await response.json();
    
    console.log('Analysis complete');
    
    // Convert PDF to base64 for frontend display
    const pdfBase64 = req.file.buffer.toString('base64');
    
    res.json({
      success: true,
      filename: req.file.originalname,
      pdfData: pdfBase64,
      segments: result
    });

  } catch (error) {
    console.error('Error analyzing PDF:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check if PDF service is available
app.get('/api/pdf-service-status', async (req, res) => {
  try {
    const response = await fetch('http://localhost:5060/info', {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      const info = await response.json();
      res.json({ available: true, info });
    } else {
      res.json({ available: false, error: 'Service returned non-OK status' });
    }
  } catch (error) {
    res.json({ available: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Make sure PDF analysis service is running on port 5060`);
});