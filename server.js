const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const User = require('./models/User');
const Recipe = require('./models/Recipe');

dotenv.config();
const app = express();

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.log("❌ MongoDB Connection Error:", err));

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

// Set EJS as the template engine
app.set('view engine', 'ejs');

// Serve static files
app.use(express.static('public'));

//Route index
app.get('/', (req, res) => {
    res.render('index', { user: req.session.user || null });
});

// Routes
app.get('/register', (req, res) => {
    res.render('register', { user: req.session.user || null });
});

app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if the user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).send("User already exists. Try logging in.");
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        user = new User({ username, email, password: hashedPassword });
        await user.save();

        // Store user session
        req.session.user = user;
        
        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

app.get('/login', (req, res) => {
    res.render('login', { user: req.session.user || null });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.send('Invalid credentials'); // User not found
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.send('Invalid credentials'); // Wrong password
        }

        req.session.user = user;
        res.redirect('/dashboard');
    } catch (err) {
        console.log(err);
        res.send('Server Error');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
            return res.send('Error logging out');
        }
        res.redirect('/login'); // Redirect to login page after logout
    });
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('dashboard', { user: req.session.user });
});

app.get('/recipes', async (req, res) => {
    try {
        const recipes = await Recipe.find(); // Fetch all recipes
        res.render('recipes', { recipes, user: req.session.user }); // Pass 'user' to EJS
    } catch (err) {
        console.log(err);
        res.send('Error fetching recipes');
    }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
