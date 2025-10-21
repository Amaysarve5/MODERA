// backend/scripts/fix-image-urls.js
const mongoose = require('mongoose');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/e-commerce';
const FROM = process.env.REPLACE_FROM || 'http://localhost:4000';
const TO = process.env.REPLACE_TO || (process.env.BASE_URL || 'https://modera-backend.onrender.com').replace(/\/$/, '');

async function run() {
  await mongoose.connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB');
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const products = await Product.find({});
  let updated = 0;
  for (const p of products) {
    if (p.image && typeof p.image === 'string' && p.image.includes(FROM)) {
      p.image = p.image.replace(FROM, TO);
      await p.save();
      updated++;
    }
  }
  console.log(`Updated ${updated} products`);
  process.exit(0);
}

run().catch(err => {
  console.error('Migration error', err);
  process.exit(1);
});
