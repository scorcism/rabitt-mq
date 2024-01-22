const amqp = require("amqplib");
const nodemailer = require("nodemailer");

// RabbitMQ connection
const rabbitMQUrl = "amqp://localhost";
let channel;

async function setupRabbitMQ() {
  const connection = await amqp.connect(rabbitMQUrl);
  channel = await connection.createChannel();

  // Define the same queue as in the Express app
  const queueName = "email_queue";
  await channel.assertQueue(queueName, { durable: true });

  // Set up a consumer for the queue
  channel.consume(queueName, async (msg) => {
    const { to, subject, text } = JSON.parse(msg.content.toString());

    // Send email using nodemailer
    console.log("GOT THE MAIL: ", to, subject, text);

    // Acknowledge the message to remove it from the queue
    channel.ack(msg);
  });
}

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your_email@gmail.com",
    pass: "your_email_password",
  },
});

// Function to send emails
async function sendEmail(to, subject, text) {
  const mailOptions = {
    from: "your_email@gmail.com",
    to,
    subject,
    text,
  };

  await transporter.sendMail(mailOptions);
}

// Start the worker server
async function start() {
  await setupRabbitMQ();
}

start();
