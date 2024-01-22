const express = require('express');
const bodyParser = require('body-parser');
const amqp = require('amqplib');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// RabbitMQ connection
const rabbitMQUrl = 'amqp://localhost';
let channel;

async function setupRabbitMQ() {
  const connection = await amqp.connect(rabbitMQUrl);
  channel = await connection.createChannel();

  // Define a queue for email tasks
  const queueName = 'email_queue';
  await channel.assertQueue(queueName, { durable: true });
}

// Express route to send emails
app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, text } = req.body;

    // Send task to RabbitMQ queue
    await channel.sendToQueue('email_queue', Buffer.from(JSON.stringify({ to, subject, text })), { persistent: true });

    res.status(200).json({ message: 'Email task sent to the worker.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the Express app
async function start() {
  await setupRabbitMQ();
  app.listen(PORT, () => {
    console.log(`Producer is running on http://localhost:${PORT}`);
  });
}

start();
