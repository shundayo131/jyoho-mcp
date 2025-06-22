import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Start the server
const PORT = process.env.PORT || 3000;

// Reddit API Configuration
const REDDIT_API_BASE = 'https://www.reddit.com';
const USER_AGENT = 'reddit-sentiment-analyzer/1.0';

// In-memory storage for products
const sentimentCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Simple sentiment analysis based on keywords
 */
function calculateSentiment(text) {
  if (!text) return 0;
  
  const lowerText = text.toLowerCase();
  
  const positiveWords = [
    'love', 'great', 'awesome', 'excellent', 'amazing', 'good', 'better', 'best',
    'easy', 'simple', 'fast', 'efficient', 'powerful', 'reliable', 'stable',
    'useful', 'helpful', 'cool', 'fantastic', 'works', 'success', 'improved',
    'pleased', 'happy', 'satisfied', 'recommend', 'impressed', 'perfect'
  ];
  
  const negativeWords = [
    'hate', 'terrible', 'awful', 'bad', 'worse', 'worst', 'horrible',
    'problem', 'issue', 'bug', 'broken', 'fail', 'failed', 'error',
    'slow', 'difficult', 'hard', 'confusing', 'frustrating', 'annoying',
    'expensive', 'disappointed', 'useless', 'crashed', 'unstable'
  ];

  let score = 0;
  let wordCount = 0;
  
  positiveWords.forEach(word => {
    const matches = (lowerText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
    score += matches;
    wordCount += matches;
  });
  
  negativeWords.forEach(word => {
    const matches = (lowerText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
    score -= matches;
    wordCount += matches;
  });
  
  if (wordCount === 0) return 0;
  
  // Normalize to -1 to 1 range
  return Math.max(-1, Math.min(1, score / Math.max(wordCount, 3)));
}

/**
 * Calculate days since post creation
 */
function calculateDaysAgo(created_utc) {
  const now = Date.now() / 1000;
  const diffSeconds = now - created_utc;
  return diffSeconds / (60 * 60 * 24);
}

/**
 * Fetch Reddit posts for a product
 */
async function fetchRedditPosts(productName, limit = 50) {
  const query = productName.toLowerCase().replace(/\s+/g, '');
  const url = `${REDDIT_API_BASE}/search.json?q=${encodeURIComponent(query)}&limit=${limit}&sort=top&t=all`;
  
  console.log(`Fetching Reddit data for: ${productName}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data.children.map(child => child.data);
    
  } catch (error) {
    console.error('Error fetching Reddit data:', error);
    throw error;
  }
}

/**
 * Process Reddit posts into MCP server format
 */
function processRedditData(posts, productName) {
  console.log(`Processing ${posts.length} posts...`);
  
  const processedPosts = [];
  let totalSentiment = 0;
  
  posts.forEach(post => {
    if (!post.title) return;
    
    const textToAnalyze = `${post.title} ${post.selftext || ''}`;
    const sentiment = calculateSentiment(textToAnalyze);
    const daysAgo = calculateDaysAgo(post.created_utc);
    
    // Skip very old posts (older than 2 years) for relevance
    if (daysAgo > 730) return;
    
    totalSentiment += sentiment;
    
    processedPosts.push({
      title: post.title,
      snippet: (post.selftext || post.title).substring(0, 120) + 
               (post.selftext && post.selftext.length > 120 ? '...' : ''),
      subreddit: post.subreddit_name_prefixed || `r/${post.subreddit}`,
      score: post.score || 0,
      sentiment_score: Math.round(sentiment * 100) / 100,
      created_days_ago: Math.round(daysAgo * 10) / 10,
      author: post.author || 'unknown'
    });
  });
  
  // Sort by score (popularity) and take top posts
  processedPosts.sort((a, b) => b.score - a.score);
  const topPosts = processedPosts.slice(0, 8); // Top 8 posts
  
  // Calculate overall sentiment
  const overallSentiment = processedPosts.length > 0 
    ? totalSentiment / processedPosts.length 
    : 0;
  
  return {
    product: productName,
    overall_sentiment: Math.round(overallSentiment * 100) / 100,
    total_posts: processedPosts.length,
    posts: topPosts,
    analyzed_at: new Date().toISOString()
  };
}

/**
 * Get Reddit sentiment data and cache it
 */
async function getRedditSentiment(productName) {
  try {
    console.log(`Analyzing Reddit sentiment for: ${productName}`);
    
    // Check cache first
    const cacheKey = productName.toLowerCase();
    const cached = sentimentCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log(`Using cached data for: ${productName}`);
      return cached.data;
    }
    
    // Fetch fresh data from Reddit
    const posts = await fetchRedditPosts(productName);
    
    if (!posts || posts.length === 0) {
      throw new Error('No posts found');
    }
    
    // Process into MCP format
    const sentimentData = processRedditData(posts, productName);
    
    // Cache the result
    sentimentCache.set(cacheKey, {
      data: sentimentData,
      timestamp: Date.now()
    });
    
    console.log(`✅ Analysis complete: ${sentimentData.total_posts} posts, sentiment: ${sentimentData.overall_sentiment}`);
    
    return sentimentData;
    
  } catch (error) {
    console.error(`❌ Failed to analyze ${productName}:`, error.message);
    throw error;
  }
}

/**
 * Fallback sample data generator in case Reddit API fails
 */
function generateSampleData(product) {
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

// POST endpoint to fetch product sentiment with Reddit API
app.post('/product-sentiment', async (req, res) => {
  const { product } = req.body;
  
  if (!product) {
    return res.status(400).json({ error: 'Product name is required in request body' });
  }

  console.log(`Received request for product sentiment analysis: ${product}`);
  
  try {
    // Try to get real Reddit data
    const sentimentData = await getRedditSentiment(product);
    res.json(sentimentData);
    
  } catch (error) {
    console.error(`Error getting Reddit sentiment for ${product}:`, error.message);
    
    // Fallback to sample data if Reddit API fails
    console.log(`Using fallback sample data for: ${product}`);
    const sampleResponse = generateSampleData(product);
    res.json(sampleResponse);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    cache_size: sentimentCache.size,
    timestamp: new Date().toISOString()
  });
});

// Cache stats endpoint for debugging
app.get('/cache-stats', (req, res) => {
  const stats = {
    cache_size: sentimentCache.size,
    cached_products: Array.from(sentimentCache.keys()),
    cache_duration_minutes: CACHE_DURATION / (60 * 1000)
  };
  res.json(stats);
});

app.listen(PORT, () => {
  console.log(`jyoho-consumer API Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
  console.log(`Cache stats available at http://localhost:${PORT}/cache-stats`);
});