const express = require("express");
const storage = require("../lib/storage");

const router = express.Router();
const sessionId = (req) => {
  req.session.cartInitialized = true;
  return req.sessionID;
};

router.delete("/clear-cart", async (req, res, next) => {
  try {
    await storage.clearOrders(sessionId(req));
    res.json({ success: true, message: "Cart cleared successfully!" });
  } catch (error) { next(error); }
});

router.post("/submit-offert", async (req, res, next) => {
  try {
    await storage.saveQuote(sessionId(req), req.body);
    res.json({ success: true, message: "Offert successfully submitted!" });
  } catch (error) { next(error); }
});

module.exports = router;
