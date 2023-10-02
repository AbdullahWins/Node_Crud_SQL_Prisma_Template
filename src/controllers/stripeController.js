const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { stripesCollection } = require("../../config/database/db");
const { SendEmail } = require("../services/email/SendEmail");

//get all WhitelistedCustomer
const getAllWhitelistedCustomers = async (req, res) => {
  try {
    const query = {};
    const cursor = stripesCollection.find(query);
    const whitelistedCustomers = await cursor.toArray();
    console.log(`Found ${whitelistedCustomers.length} whitelistedCustomers`);
    res.send(whitelistedCustomers);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

//check one WhitelistedCustomer
const checkWhitelistedCustomersByEmail = async (req, res) => {
  try {
    const userEmail = req.params.email;
    const result = await stripesCollection.find({}).toArray();
    const exists = result.some((customer) => customer.email === userEmail);
    res.send(exists);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to check whitelistedCustomer");
  }
};

//handle payment success
const handleStripeWebhookOnSuccess = async (request, response) => {
  const sig = request.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;
  let event;
  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    console.error(err);
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case "charge.succeeded":
      const chargeSucceeded = event.data.object;
      const email = chargeSucceeded?.billing_details?.email;
      const name = chargeSucceeded?.billing_details?.name;
      const price = chargeSucceeded?.amount / 100;
      const formattedData = {
        email,
        name,
        price,
        timestamp: Math.floor(Date.now() / 1000),
      };
      const result = await stripesCollection.insertOne(formattedData);
      console.log(result);
      const receiver = email;
      const subject = "Welcome to EdenBerry!";
      const text =
        "Your payment has been verified! Please follow this link to download our mobile app. https://github.com/AbdullahWins";
      const emailStatus = await SendEmail(receiver, subject, text);
      console.log(emailStatus);
      console.log(formattedData);
      // Then define and call a function to handle the event charge.succeeded
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  response.send();
};

module.exports = {
  getAllWhitelistedCustomers,
  checkWhitelistedCustomersByEmail,
  handleStripeWebhookOnSuccess,
};
