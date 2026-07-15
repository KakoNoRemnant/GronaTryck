const express = require("express");
const storage = require("../lib/storage");

const router = express.Router();

router.post("/send-message", async (req, res, next) => {
  try {
    await storage.saveContact(req.body);
    res.json({ success: true, message: "Contact message saved successfully!" });
  } catch (error) { next(error); }
});

module.exports = router;
