import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from 'zod';

// Constants for Jyoho API 
const JYOHO_API_BASE = "http://localhost:3000"; // This is where we run our Jyoho API. Change port as needed
const USER_AGENT = "mcp-jyoho/1.0"; 

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
 * Function to call jyoho-consumer API 
 * Calls localhost:3000/products - GET and logs the response
 */
async function callJyohoAPI() {
  try {    
    const response = await fetch(`${JYOHO_API_BASE}/products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    
  } catch (error) {
    // Log any errors that occur during the API call
  }
}


/**
 * get-sentiment tool
 * Get market sentiment for a specific product 
 */
server.tool(
  "get-product-sentiment",
  "Get sentiment analysis for a product from Reddit discussions",
  {
    product: z.string().min(1).describe("Product name to analyze (e.g., 'AWS Lambda')"),
  },
  async ({ product }) => {
    
    // TEST: Call the API and log response
    const apiResult = await callJyohoAPI();

    // TEST: Simulate Reddit API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // TEST: Mock response data (simulating what we'd get from Reddit API)
    const mockRedditData = {
      product: product,
      sentiment_score: 0.9,
      total_posts: 100,
      positive_mentions: 50,
      negative_mentions: 25,
      neutral_mentions: 25,
      top_subreddits: ["r/programming", "r/aws", "r/devops"],
      sample_posts: [
        "Love using AWS Lambda for serverless functions!",
        "Lambda cold starts are still an issue...",
        "Just deployed my first Lambda function, pretty cool",
        "I am also using Lambda for data processing tasks.",
      ]
    };

    // Format simple response to the MCP client
    const responseText = [
      `Reddit Sentiment for "${product}":`,
      ``,
      `Score: ${mockRedditData.sentiment_score}/1.0`,
      `Total Posts Found: ${mockRedditData.total_posts}`,
      `Positive: ${mockRedditData.positive_mentions}`,
      `Negative: ${mockRedditData.negative_mentions}`,
      `Neutral: ${mockRedditData.neutral_mentions}`,
      ``,
      `Top Subreddits: ${mockRedditData.top_subreddits.join(", ")}`,
      ``,
      `Sample Comments:`,
      ...mockRedditData.sample_posts.map((post, i) => `${i+1}. "${post}"`),
    ].join("\n");

    return {
      content: [
        {
          type: "text",
          text: responseText,
        },
      ],
    };
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