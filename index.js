const express = require("express");
const session = require("express-session");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const database = require("./lib/database");

const app = express();
const PORT = process.env.PORT || 3000;

const sessionSecret = process.env.SESSION_SECRET || "local-development-secret-change-me";
const sessionStore = database.enabled
  ? new (require("connect-pg-simple")(session))({
      pool: database.pool,
      createTableIfMissing: true,
    })
  : undefined;

app.use(
  session({
    store: sessionStore,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    proxy: process.env.NODE_ENV === "production",
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// --- Static files & views ---
app.use("/static", express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// --- Routes ---
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const contactRoutes = require("./routes/contactRoutes");
const offertRoutes = require("./routes/offertRoutes");

app.use("/", productRoutes);
app.use("/user", userRoutes);
app.use("/order", orderRoutes);
app.use("/contact", contactRoutes);
app.use("/api", offertRoutes);

// Link to the product page
app.get("/produktsidan/:id", (req, res) => {
  const productId = req.params.id;

  fs.readFile(
    path.join(__dirname, "data/products.json"),
    "utf-8",
    (err, data) => {
      if (err) {
        console.error("Error reading products file:", err);
        return res.status(500).send("Internal Server Error");
      }

      const products = JSON.parse(data);
      const product = products.find((p) => p.id == productId);

      if (!product) {
        return res.status(404).send("Product not found");
      }

      res.render("produktsidan", { product, products });
    }
  );
});

// Serve the products.json file at /data/products.json
app.get("/data/products.json", (req, res) => {
  const productsFilePath = path.join(__dirname, "data", "products.json");
  fs.readFile(productsFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading products file:", err);
      res.status(500).send("Internal Server Error");
      return;
    }
    res.setHeader("Content-Type", "application/json");
    res.send(data);
  });
});

// Loading products in klader
app.get("/klader", (req, res) => {
  fs.readFile(
    path.join(__dirname, "data/products.json"),
    "utf-8",
    (err, data) => {
      if (err) {
        console.error("Error reading products file:", err);
        return res.status(500).send("Internal Server Error");
      }

      const products = JSON.parse(data);
      res.render("klader", { products });
    }
  );
});

// Routes for other pages
app.get("/index", (req, res) => res.redirect("/"));
app.get("/butik", (req, res) => res.render("butik"));
app.get("/stanleyStella", (req, res) => res.render("stanleystella"));
app.get("/hallbarhet", (req, res) => res.render("hallbarhet"));
app.get("/about", (req, res) => res.render("about"));
app.get("/kontakt", (req, res) => res.render("kontakt"));
app.get("/gots", (req, res) => res.render("gots"));
app.get("/miljo", (req, res) => res.render("miljo"));
app.get("/villkor", (req, res) => res.render("villkor"));
app.get("/tryck", (req, res) => res.render("tryck"));
app.get("/faq", (req, res) => res.render("faq"));
app.get("/offertforfragan", (req, res) => res.render("offertforfragan"));
app.get("/installning-sidan/mina-sidor", (req, res) =>
  res.render("installning-sidan/mina-sidor")
);

// --- Start server ONLY when running locally ---
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

app.get("/api/health", (req, res) =>
  res.json({ ok: true, database: database.enabled ? "configured" : "local-json" })
);

// Basic error handler so requests don't hang silently
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).send("Internal Server Error");
});

module.exports = app;
