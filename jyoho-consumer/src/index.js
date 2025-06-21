// consumer.js - Express API with In-Memory Data
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Start the server
const PORT = process.env.PORT || 3000;

// Kafka consumer service 

// In-memory storage for products

// Get endpoint to fetch products 


app.listen(PORT, () => {
  console.log(`jyoho-consuer API Server running on port ${PORT}`);
});