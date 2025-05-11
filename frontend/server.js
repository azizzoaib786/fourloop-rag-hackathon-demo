const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') // Make sure this directory exists
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage: storage });

// API Routes
app.post('/api/chat', async (req, res) => {
    try {
        const { query } = req.body;
        
        // TODO: Implement your actual AI/chat logic here
        // This is just a mock response
        const response = {
            reply: `I received your query: "${query}". This is a mock response. Implement your actual AI logic here.`,
            isHtml: false,
            sources: ['Mock Database', 'Mock Document']
        };
        
        res.json(response);
    } catch (error) {
        console.error('Error in chat endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // TODO: Implement your actual file processing logic here
        // This is just a mock response
        const response = {
            message: 'File processed successfully',
            fileName: req.file.originalname,
            fileId: Date.now().toString()
        };

        res.json(response);
    } catch (error) {
        console.error('Error in upload endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 