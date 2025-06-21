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



/**
 * Generate sample test data to respond to product sentiment requests.
 * This function simulates fetching sentiment data for a given product.
 */
function generateSampleData (product) {
  return {
    product: product,
    overall_sentiment: 0.19,
    total_posts: 7,
    posts: [
      {
        title: "Serverless at scale: Lessons from Capital One",
        snippet: "Our journey with AWS Lambda at enterprise scale. Key insights on cold starts, cost optimization, and monitoring strategies...",
        subreddit: "r/aws",
        score: 711,
        sentiment_score: 0.8,
        created_days_ago: 45.2,
        author: "CloudArchitect"
      },
      {
        title: "Lambda cold starts are killing our API performance",
        snippet: "We're seeing 2-3 second cold starts on our Lambda functions. Anyone found solutions for Java-based serverless apps?",
        subreddit: "r/serverless",
        score: 234,
        sentiment_score: -0.6,
        created_days_ago: 12.1,
        author: "backend_dev"
      },
      {
        title: "Building a Lambda function to process S3 events - surprisingly easy",
        snippet: "Just deployed my first Lambda function for image processing. The documentation was actually pretty good and setup was...",
        subreddit: "r/aws",
        score: 156,
        sentiment_score: 0.7,
        created_days_ago: 8.5,
        author: "newbie_developer"
      },
      {
        title: "Lambda pricing got expensive at scale - moved to containers",
        snippet: "After 10M+ invocations monthly, Lambda costs became prohibitive. Moved to ECS Fargate and cut costs by 60%...",
        subreddit: "r/aws",
        score: 189,
        sentiment_score: -0.3,
        created_days_ago: 23.7,
        author: "startup_cto"
      },
      {
        title: "AWS Lambda now supports .NET 8 runtime",
        snippet: "Finally! Been waiting for this update. Performance improvements are noticeable compared to .NET 6...",
        subreddit: "r/dotnet",
        score: 95,
        sentiment_score: 0.6,
        created_days_ago: 34.1,
        author: "dotnet_fanboy"
      }
    ],
    analyzed_at: new Date().toISOString()
  };
}

// POST endpoint to fetch product sentiment with query parameter
app.post('/product-sentiment', (req, res) => {
  const { product } = req.body;
  
  if (!product) {
    return res.status(400).json({ error: 'Product name is required in request body' });
  }  

  console.log(`Received request for product sentiment analysis: ${product}`);
  
  // Generate sample response based on the query parameter
  const sampleResponse = generateSampleData(product);
  
  res.json(sampleResponse);
});

app.listen(PORT, () => {
  console.log(`jyoho-consumer API Server running on port ${PORT}`);
});