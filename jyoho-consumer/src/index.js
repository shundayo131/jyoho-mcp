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
app.get('/products', (req, res) => {
  // Simulate fetching products from in-memory storage
  const demo = "hi the message is from jyoho-consumer";

  console.log('Received request for products');
  
  res.json(demo);
});

app.listen(PORT, () => {
  console.log(`jyoho-consuer API Server running on port ${PORT}`);
});