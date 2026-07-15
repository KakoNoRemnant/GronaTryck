const express = require("express");
const storage = require("../lib/storage");

const router = express.Router();

router.post("/register", async (req, res, next) => {
  try {
    const user = req.body;
    if (!user.email || !user.confirmEmail || user.email !== user.confirmEmail) {
      return res.status(400).json({ success: false, message: "Emails do not match!" });
    }
    if (!user.password || !user.confirmPassword || user.password !== user.confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match!" });
    }
    const created = await storage.createUser(user);
    if (!created) return res.status(400).json({ success: false, message: "User already exists!" });
    return res.json({ success: true, message: "Account created successfully!" });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password are required!" });
    const user = await storage.authenticateUser(email, password);
    if (!user) return res.status(400).json({ success: false, message: "Wrong email or password" });
    req.session.user = user;
    req.session.save((error) => {
      if (error) return next(error);
      return res.json({ success: true, message: "Login successful!" });
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/session", (req, res) =>
  res.json(req.session?.user ? { loggedIn: true, user: req.session.user } : { loggedIn: false })
);

router.post("/logout", (req, res, next) => {
  if (!req.session) return res.json({ success: true, message: "Logout successful" });
  req.session.destroy((error) => {
    if (error) return next(error);
    return res.json({ success: true, message: "Logout successful" });
  });
});

module.exports = router;
