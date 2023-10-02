const express = require("express");
const router = require("express").Router();

const {
  getAllWhitelistedCustomers,
  checkWhitelistedCustomersByEmail,
  handleStripeWebhookOnSuccess,
} = require("../controllers/stripeController");

router.get("/stripe", getAllWhitelistedCustomers);
router.get("/stripe/find/:email", checkWhitelistedCustomersByEmail);
router.post(
  "/stripe/paymentsuccessful",
  express.raw({ type: "application/json" }),
  handleStripeWebhookOnSuccess
);

module.exports = router;
