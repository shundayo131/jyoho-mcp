//import necessary modules
const express = require('express');
const { Kafka } = require('kafkajs');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

// create an express app
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 4000;



// start the server and check if it's running
app.get('/', (req, res) => {
  res.send('jyoho-producer API is running');
});

app.listen(PORT, () => {
  console.log(`jyoho-producer API Server running on port ${PORT}`);
});

// create a Kafka client
const kafka = new Kafka({
  clientId: 'jyoho-producer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  ssl: true, // Enable SSL for secure connection.
  sasl: {
    mechanism: 'plain', // SASL mechanism.
    username: process.env.CLUSTER_API_KEY, // Confluent Cloud API key.
    password: process.env.CLUSTER_API_SECRET, // Confluent Cloud API secret.
  },
});

// create a Kafka producer
const producer = kafka.producer();

// connect the producer
const connectProducer = async () => {
  try {
    await producer.connect();
    console.log('Kafka Producer connected successfully');
  } catch (error) {
    console.error('Error connecting Kafka Producer:', error);
  }
};

const TOPIC = process.env.TOPIC 
const POLL_INTERVAL = process.env.POLL_INTERVAL_MS || 300000; // 5 min default

// connect to the upstream data source (REDDIT API)

// fetch data from Reddit API
const fetchRedditData = async (query = process.env.QUERY) => {
  try {
    let url ='';
    if (query && query.trim() !== '') {
        url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=5`;
    } else {
        url = 'https://www.reddit.com/r/all/top.json?limit=10'; // Fetch top posts from all subreddits
    }
    const response = await axios.get(url); 
    console.log('Fetched data from Reddit:', response.data);
    return response.data.data.children.map(child => child.data); // TBD the data structure
  } catch (error) {
    console.error('Error fetching data from Reddit:', error);
    return [];
  }
};


// define function to send messages to Kafka (by polling)
const sendToKafka = async () => {
  try {
    const data = await fetchRedditData();
    if (data.length > 0) {
      for (const item of data) {// Iterate through each item in the data
        await producer.send({
          topic: TOPIC,
          messages: [
            { value: JSON.stringify(item) },
          ],
        });
        console.log('Sent message to Kafka:', item);
      }
    } else {
      console.log('No new data to send to Kafka');
    }
  } catch (error) {
    console.error('Error sending message to Kafka:', error);
  }
};


// call the function to send data to Kafka
const startProducer = async () => {
  await connectProducer();
  await sendToKafka(); 
  setInterval(sendToKafka, POLL_INTERVAL);
};
startProducer().catch(error => {
  console.error('Error starting producer:', error);
});

// gracefully handle shutdown
const gracefulShutdown = async () => {
  try {
    console.log('Shutting down gracefully...');
    await producer.disconnect();
    console.log('Kafka Producer disconnected');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};


process.on('SIGINT', gracefulShutdown); // Handle Ctrl+C
process.on('SIGTERM', gracefulShutdown); // Handle termination signal