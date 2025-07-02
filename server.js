// --- Imports ---
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');

// --- App Initialization ---
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your-super-secret-key-that-is-long-and-secure';

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- File Paths ---
const dataDir = path.join(__dirname, 'data');
const usersFilePath = path.join(dataDir, 'users.json');
const questionsFilePath = path.join(dataDir, 'questions.json');
const interpretationsFilePath = path.join(dataDir, 'interpretations.json');
const resultsFilePath = path.join(dataDir, 'results.json');

// --- Multer Configuration for CSV upload ---
const upload = multer({ storage: multer.memoryStorage() });

// --- Helper Functions ---
const readData = async (filePath) => {
    try {
        await fs.access(filePath);
        const data = await fs.readFile(filePath, 'utf-8');
        if (data.trim() === '') return [];
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
};

const writeData = async (filePath, data) => {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

// --- Authentication Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- API Routes ---

// User Signup
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) return res.status(400).json({ message: 'All fields are required.' });
        
        const users = await readData(usersFilePath);

        if (users.find(user => user.email.toLowerCase() === email.toLowerCase())) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }
        if (users.find(user => user.username.toLowerCase() === username.toLowerCase())) {
            return res.status(409).json({ message: 'This username is already taken. Please choose another.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = { id: Date.now().toString(), username, email, password: hashedPassword };
        users.push(newUser);
        await writeData(usersFilePath, users);
        res.status(201).json({ message: 'User created successfully.' });
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const users = await readData(usersFilePath);
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            return res.status(404).json({ message: 'No account found with this email address.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect password. Please try again.' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, username: user.username });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Upload questions from CSV
app.post('/api/test/upload-questions', authenticateToken, upload.single('questionsFile'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const newQuestions = [];
    const bufferStream = new require('stream').Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    bufferStream.pipe(csv({
        mapHeaders: ({ header }) => header.trim().toLowerCase(),
        bom: true,
    })).on('data', (row) => {
        const question = { question: row.question, options: [] };
        for (let i = 1; i <= 4; i++) {
            if (row[`option${i}_text`] && row[`option${i}_type`]) {
                question.options.push({ text: row[`option${i}_text`], type: row[`option${i}_type`] });
            }
        }
        if (question.question && question.options.length > 0) {
            newQuestions.push(question);
        }
    }).on('end', async () => {
        try {
            if (newQuestions.length > 0) {
                await writeData(questionsFilePath, newQuestions);
                res.status(200).json({ message: `Successfully uploaded and processed ${newQuestions.length} questions.` });
            } else {
                res.status(400).json({ message: 'Upload failed. The CSV file is empty or has an invalid format. No questions were found.' });
            }
        } catch (error) {
            console.error('Error writing questions file:', error);
            res.status(500).json({ message: 'Error saving the new questions.' });
        }
    }).on('error', (error) => {
        console.error('Error parsing CSV:', error);
        res.status(500).json({ message: 'Error processing the CSV file.' });
    });
});

// Get Test Questions
app.get('/api/test/questions', authenticateToken, async (req, res) => {
    try {
        const questions = await readData(questionsFilePath);
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Could not fetch questions.' });
    }
});

// Get Interpretations
app.get('/api/test/interpretations', authenticateToken, async (req, res) => {
    try {
        const interpretations = await readData(interpretationsFilePath);
        res.json(interpretations);
    } catch (error) {
        res.status(500).json({ message: 'Could not fetch interpretations.' });
    }
});

// Submit Test Results
app.post('/api/test/submit', authenticateToken, async (req, res) => {
    try {
        const { answers } = req.body;
        if (!answers) return res.status(400).json({ message: 'Answers are required.' });
        const results = await readData(resultsFilePath);
        results.push({ userId: req.user.id, date: new Date().toISOString(), scores: answers });
        await writeData(resultsFilePath, results);
        res.status(201).json({ message: 'Results saved successfully.' });
    } catch (error) {
        console.error('Submit Error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// --- Server Start ---
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});
