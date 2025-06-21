import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from 'zod';

// Constants for Jyoho API 
const JYOHO_API_BASE = "http://localhost:3000"; // This is where we run our Jyoho API. Change port as needed
const USER_AGENT = "mcp-jyoho/1.0"; 

// Simplified type definitions
interface RedditPost {
  title: string;
  snippet: string;
  subreddit: string;
  score: number;
  sentiment_score: number;
  created_days_ago: number;
  author: string;
}

interface SentimentData {
  product: string;
  overall_sentiment: number;
  total_posts: number;
  posts: RedditPost[];
  analyzed_at: string;
}

// Create the MCP server instance
// This is the main server object that will handle all MCP protocol interactions
const server = new McpServer({
  name: "jyoho",
  version:  "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  }
});

/** 
 * Get Reddit sentiment data from Jyoho API
 */
async function getProductSentimentFromJyoho(product: string): Promise<SentimentData | null> {
  try {    
    const response = await fetch(`${JYOHO_API_BASE}/product-sentiment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product })
    });

    if (!response.ok) {
      throw new Error(`Jyoho API call failed: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return data as SentimentData;
    
  } catch (error) {
    console.error('Error calling Jyoho API:', error);
    throw error;
  }
}

/**
 * Helper function to get sentiment description
 */
function getSentimentDescription(score: number): string {
  if (score >= 0.6) return "Positive";
  if (score >= 0.2) return "Slightly Positive";
  if (score >= -0.2) return "Neutral";
  if (score >= -0.6) return "Slightly Negative";
  return "Negative";
}

/**
 * Helper function to format time ago
 */
function formatTimeAgo(daysAgo: number): string {
  if (daysAgo < 1) return 'today';
  if (daysAgo < 2) return 'yesterday';
  if (daysAgo < 7) return `${Math.floor(daysAgo)} days ago`;
  if (daysAgo < 30) return `${Math.floor(daysAgo/7)} weeks ago`;
  return `${Math.floor(daysAgo/30)} months ago`;
}

/**
 * get-product-sentiment tool
 * Get market sentiment for a specific product from Reddit discussions via Jyoho API
 */
server.tool(
  "get-product-sentiment",
  "Get sentiment analysis for a product from Reddit discussions",
  {
    product: z.string().min(1).describe("Product name to analyze (e.g., 'AWS Lambda')"),
  },
  async ({ product }) => {
    
    try {
      let sentimentData: SentimentData | null = null;
      
      // Try Jyoho API first, fallback to sample data
      try {
        sentimentData = await getProductSentimentFromJyoho(product);
      } catch (apiError) {
        console.error('Using sample data - Jyoho API unavailable');
        // sentimentData = generateSampleData(product);
      }
      
      if (!sentimentData) {
        return {
          content: [
            {
              type: "text",
              text: `No sentiment data available for "${product}".`,
            },
          ],
        };
      }

      // Build simplified response
      const overallDesc = getSentimentDescription(sentimentData.overall_sentiment);
      
      const responseLines = [
        `Reddit Sentiment: ${sentimentData.product}`,
        `Overall: ${sentimentData.overall_sentiment.toFixed(2)}/1.0 (${overallDesc})`,
        `Posts Analyzed: ${sentimentData.total_posts}`,
        ``,
        `Recent Reddit Posts:`,
      ];

      // Add posts
      sentimentData.posts.forEach((post: RedditPost, i: number) => {
        const postSentiment = getSentimentDescription(post.sentiment_score);
        const timeAgo = formatTimeAgo(post.created_days_ago);
        
        responseLines.push(
          ``,
          `${i + 1}. "${post.title}"`,
          `   ${post.subreddit} • u/${post.author} • ${timeAgo} • Score: ${post.score}`,
          `   Sentiment: ${postSentiment} (${post.sentiment_score.toFixed(2)})`,
          `   "${post.snippet}"`
        );
      });

      responseLines.push(
        ``,
        `Analysis: ${new Date(sentimentData.analyzed_at).toLocaleDateString()}`
      );

      return {
        content: [
          {
            type: "text",
            text: responseLines.join("\n"),
          },
        ],
      };

    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error analyzing sentiment for "${product}": ${error.message}`,
          },
        ],
      };
    }
  }
);

// Start the server 
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});