require("dotenv").config(); // Load environment variables

const port = process.env.PORT || 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const path = require("path");
const cors = require("cors");

const JWT_SECRET = process.env.JWT_SECRET;
const BASE_URL = process.env.BASE_URL || `http://localhost:${port}`; // fallback for dev

// Helper: normalize image URLs so deployed frontend doesn't try to load from localhost
function normalizeImageUrl(url, baseForResponse) {
    if (!url || typeof url !== 'string') return url;
    // If it's already an absolute URL and not localhost, return it
    try {
        const parsed = new URL(url);
        if (parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') return url;
        // If hostname is localhost, replace origin with baseForResponse
        return `${baseForResponse}/images/${parsed.pathname.split('/').pop()}`;
    } catch (e) {
        // Not an absolute URL, could be a relative path like /images/xxx
        if (url.startsWith('/images')) return `${baseForResponse}${url}`;
        // if it's just a filename
        return `${baseForResponse}/images/${url}`;
    }
}

// ✅ CORS Fix - allow frontend domains
app.use(cors({
    origin: ['https://modera.onrender.com', 'http://localhost:5173'],
    credentials: true
}));

app.use(express.json());

// Database connection with MongoDB
mongoose.connect(process.env.MONGODB_URL);

// API test
app.get("/", (req, res) => {
    res.send("Express app is running");
});

// Configure Cloudinary (if env vars provided)
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

// Use memoryStorage so we can either upload to Cloudinary or write to disk as a fallback
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Serve uploaded images from absolute path to avoid path issues on hosts like Render
app.use('/images', express.static(path.join(__dirname, 'upload', 'images')));

// Temporary debug route to list uploaded images and their public URLs
// Access: GET /debug-images
app.get('/debug-images', (req, res) => {
    const imagesDir = path.join(__dirname, 'upload', 'images');
    const configuredBase = process.env.BASE_URL ? process.env.BASE_URL.replace(/\/$/, '') : null;
    const requestBase = `${req.protocol}://${req.get('host')}`;
    const baseForResponse = configuredBase || requestBase;

    const fs = require('fs');
    fs.readdir(imagesDir, (err, files) => {
        if (err) {
            console.error('Debug images read error:', err);
            return res.status(500).json({ success: 0, error: 'Could not read images directory' });
        }
        const imageFiles = files.filter((f) => !f.startsWith('.')).map((f) => ({
            filename: f,
            url: `${baseForResponse}/images/${f}`
        }));
        res.json({ success: 1, count: imageFiles.length, images: imageFiles });
    });
});

// Image Upload Endpoint
app.post("/upload", upload.single('product'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: 0,
                message: "No file uploaded or multer failed to parse the file"
            });
        }

        // Create a deterministic filename (without path) to use as public_id when uploading to Cloudinary
        const filenameBase = `product_${Date.now()}`;
        const ext = path.extname(req.file.originalname) || '.png';
        const filename = `${filenameBase}${ext}`;

        // Build base for response (used when returning disk-based URLs)
        const configuredBase = process.env.BASE_URL ? process.env.BASE_URL.replace(/\/$/, '') : null;
        const requestBase = `${req.protocol}://${req.get('host')}`;
        const baseForResponse = configuredBase || requestBase;

        // If Cloudinary is configured, upload buffer to Cloudinary and return secure URL
        if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
            const uploadStream = cloudinary.uploader.upload_stream({
                folder: process.env.CLOUDINARY_FOLDER || 'modera_products',
                public_id: filenameBase,
                resource_type: 'image',
                overwrite: true,
            }, (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    return res.status(500).json({ success: 0, message: 'Cloudinary upload failed' });
                }
                return res.json({ success: 1, image_url: result.secure_url });
            });
            // Send buffer to upload stream
            uploadStream.end(req.file.buffer);
            return;
        }

        // Fallback: write file to disk (existing behavior) then return disk URL
        const destPath = path.join(__dirname, 'upload', 'images');
        // ensure directory exists
        fs.mkdir(destPath, { recursive: true }, (dirErr) => {
            if (dirErr) {
                console.error('Could not create images directory:', dirErr);
                return res.status(500).json({ success: 0, message: 'Server error creating directory' });
            }
            const outPath = path.join(destPath, filename);
            fs.writeFile(outPath, req.file.buffer, (writeErr) => {
                if (writeErr) {
                    console.error('Write file error:', writeErr);
                    return res.status(500).json({ success: 0, message: 'Failed to save file' });
                }
                return res.json({ success: 1, image_url: `${baseForResponse}/images/${filename}` });
            });
        });

    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ success: 0, message: "Internal Server Error" });
    }
});

// Schema for creating products
const Product = mongoose.model("Product", {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    new_price: { type: Number, required: true },
    old_price: { type: Number, required: true },
    available: { type: Boolean, default: true },
});

// Add Product API
app.post('/addproduct', async (req, res) => {
    let products = await Product.find({});
    let id;
    if (products.length > 0) {
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id + 1;
    } else {
        id = 1;
    }
    const product = new Product({
        id: id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
    });
    console.log(product);
    await product.save();
    console.log("saved");
    res.json({
        success: true,
        name: req.body.name,
    });
});

// Remove Product API
app.post('/removeproduct', async (req, res) => {
    await Product.findOneAndDelete({ id: req.body.id });
    res.json({
        success: true,
        name: req.body.name
    });
});

// Get All Products
app.get('/allproducts', async (req, res) => {
    let products = await Product.find({});
    console.log("all products fetched");
    const baseForResponse = process.env.BASE_URL ? process.env.BASE_URL.replace(/\/$/, '') : `${req.protocol}://${req.get('host')}`;
    // Normalize image URLs before sending
    products = products.map(p => {
        const prod = p.toObject ? p.toObject() : p;
        if (prod.image && typeof prod.image === 'string') {
            prod.image = normalizeImageUrl(prod.image, baseForResponse);
        }
        return prod;
    });
    res.send(products);
});

// User Schema
const Users = mongoose.model("Users", {
    name: { type: String },
    email: { type: String, unique: true },
    password: { type: String },
    cartData: { type: Object },
    date: { type: Date, default: Date.now }
});

// Signup
app.post('/signup', async (req, res) => {
    let check = await Users.findOne({ email: req.body.email });
    if (check) {
        return res.status(400).json({ success: false, error: "User already exists" });
    }

    let cart = {};
    for (let i = 0; i < 300; i++) {
        cart[i] = 0;
    }

    const user = new Users({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        cartData: cart,
    });

    await user.save();
    const data = { user: { id: user.id } };
    const token = jwt.sign(data, JWT_SECRET);
    res.json({ success: true, token });
});

// Login
app.post('/login', async (req, res) => {
    let user = await Users.findOne({ email: req.body.email });
    if (user) {
        const passCompare = req.body.password === user.password;
        if (passCompare) {
            const data = { user: { id: user.id } };
            const token = jwt.sign(data, JWT_SECRET);
            return res.json({ success: true, token });
        } else {
            return res.json({ success: false, error: "Invalid Password" });
        }
    }
    res.json({ success: false, error: "Wrong email address" });
});

// New Collection
app.get('/newcollection', async (req, res) => {
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8);
    console.log("new collection fetched");
    const baseForResponse = process.env.BASE_URL ? process.env.BASE_URL.replace(/\/$/, '') : `${req.protocol}://${req.get('host')}`;
    const normalized = newcollection.map(p => {
        const prod = p.toObject ? p.toObject() : p;
        if (prod.image && typeof prod.image === 'string') prod.image = normalizeImageUrl(prod.image, baseForResponse);
        return prod;
    });
    res.send(normalized);
});

// Popular in Women
app.get('/popularinwomen', async (req, res) => {
    let products = await Product.find({ category: "women" });
    let popular_in_women = products.slice(0, 4);
    console.log("popular in women");
    const baseForResponse = process.env.BASE_URL ? process.env.BASE_URL.replace(/\/$/, '') : `${req.protocol}://${req.get('host')}`;
    const normalized = popular_in_women.map(p => {
        const prod = p.toObject ? p.toObject() : p;
        if (prod.image && typeof prod.image === 'string') prod.image = normalizeImageUrl(prod.image, baseForResponse);
        return prod;
    });
    res.send(normalized);
});

// Middleware for token check
const fetchUser = async (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) return res.status(401).json({ error: "Token missing" });
    try {
        const data = jwt.verify(token, JWT_SECRET);
        req.user = data.user;
        next();
    } catch {
        res.status(401).json({ error: "Invalid token" });
    }
};

// Add to Cart
app.post('/addtocart', fetchUser, async (req, res) => {
    console.log("Added", req.body.itemId);
    let userData = await Users.findOne({ _id: req.user.id });
    userData.cartData[req.body.itemId] += 1;
    await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
    res.send("Added");
});

// Remove from Cart
app.post('/removefromcart', fetchUser, async (req, res) => {
    console.log("Remove", req.body.itemId);
    let userData = await Users.findOne({ _id: req.user.id });
    if (userData.cartData[req.body.itemId] > 0)
        userData.cartData[req.body.itemId] -= 1;
    await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
    res.send("Removed");
});

// Get Cart Items
app.post('/getcart', fetchUser, async (req, res) => {
    console.log("get cart");
    let userData = await Users.findOne({ _id: req.user.id });
    res.json(userData.cartData);
});

// Start Server
app.listen(port, (error) => {
    if (!error) {
        console.log("Server running on port " + port);
    } else {
        console.log("Error: " + error);
    }
});
