### Jyoho MCP – Real-Time Market Intelligence Platform
Jyoho MCP enables PMs/marketers to get real-time market sentiment via chat. Ask "What do users think about React?" and get AI insights from Reddit, Twitter, HackerNews instantly.

### Overview
Jyoho MCP transforms how product marketers and PMs access market intelligence. Through a simple chat interface, users can ask natural language questions and instantly receive AI-powered sentiment analysis from online communities where authentic conversations happen.

### How it works
We built a real-time data pipeline that ingests Reddit conversations through Kafka, processes them via a custom MCP server, and delivers insights through Claude Desktop's chat interface.

### Tech Stack
- Lanugages: TypeScript, JavaScript 
- MCP Server: Custom Model Context Protocol server
- AI Integration: Claude Desktop via MCP client
- Stream Processing: Apache Kafka 
- APIs: REST APIs using Express, Axios and Fetch

### Example Use Case
Query: "What are developers saying about AWS Lambda?"

### What's Next
Expand data sources by integrating additional forums and platforms beyond Reddit for comprehensive coverage. 2. Enhance insights by improving MCP responses with richer metadata, trend analysis, and deeper sentiment breakdowns. 3. Scale broader product coverage beyond demo products to support sentiment analysis for any product or technology. 4. Add advanced features including real-time alerts, competitive benchmarking, and sentiment visualization tools.
