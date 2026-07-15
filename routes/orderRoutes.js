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
    res.json({ success: true, message: "Orders cleared successfully." });
  } catch (error) { next(error); }
});

router.post("/add-order", async (req, res, next) => {
  const { artikelnummer, quantity, color, name, price, image } = req.body;
  if (!artikelnummer || !quantity || !color || !name || !price || !image) {
    return res.status(400).json({ success: false, message: "Missing input data for order." });
  }
  try {
    await storage.addOrder(sessionId(req), { artikelnummer, quantity, color, name, price, image });
    res.json({ success: true, message: "Order added successfully!" });
  } catch (error) { next(error); }
});

router.get("/get-orders", async (req, res, next) => {
  try {
    res.json({ success: true, orders: await storage.getOrders(sessionId(req)) });
  } catch (error) { next(error); }
});

router.delete("/delete-order", async (req, res, next) => {
  const { artikelnummer, color } = req.body;
  if (!artikelnummer || !color) return res.status(400).json({ success: false, message: "Invalid input data." });
  try {
    await storage.deleteOrder(sessionId(req), artikelnummer, color);
    res.json({ success: true, message: "Order deleted successfully!" });
  } catch (error) { next(error); }
});

module.exports = router;
