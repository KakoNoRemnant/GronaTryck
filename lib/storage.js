const fs = require("fs").promises;
const path = require("path");
const bcrypt = require("bcryptjs");
const database = require("./database");

const dataPath = (name) => path.join(__dirname, "..", "data", name);

async function readJson(name) {
  const raw = await fs.readFile(dataPath(name), "utf8");
  return raw ? JSON.parse(raw) : [];
}

async function writeJson(name, value) {
  await fs.writeFile(dataPath(name), JSON.stringify(value, null, 2));
}

async function createUser(user) {
  const passwordHash = await bcrypt.hash(user.password, 12);
  if (database.enabled) {
    await database.ensureSchema();
    const result = await database.pool.query(
      `INSERT INTO users (email, password_hash, name, address, postal_code, phone_number)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO NOTHING RETURNING email`,
      [user.email.toLowerCase(), passwordHash, user.name, user.address, user.postalCode, user.phoneNumber]
    );
    return result.rowCount === 1;
  }
  const users = await readJson("users.json");
  if (users.some((item) => item.email.toLowerCase() === user.email.toLowerCase())) return false;
  users.push({ ...user, password: passwordHash, confirmEmail: undefined, confirmPassword: undefined });
  await writeJson("users.json", users);
  return true;
}

async function authenticateUser(email, password) {
  let user;
  if (database.enabled) {
    await database.ensureSchema();
    const result = await database.pool.query(
      "SELECT email, password_hash, name FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    user = result.rows[0] && { ...result.rows[0], password: result.rows[0].password_hash };
  } else {
    const users = await readJson("users.json");
    user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
  }
  if (!user) return null;
  const valid = user.password.startsWith("$2")
    ? await bcrypt.compare(password, user.password)
    : password === user.password;
  return valid ? { email: user.email, name: user.name } : null;
}

async function addOrder(sessionId, order) {
  if (database.enabled) {
    await database.ensureSchema();
    await database.pool.query(
      `INSERT INTO orders (session_id, artikelnummer, quantity, color, name, price, image)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [sessionId, order.artikelnummer, order.quantity, order.color, order.name, order.price, order.image]
    );
    return;
  }
  const orders = await readJson("orders.json");
  orders.push(order);
  await writeJson("orders.json", orders);
}

async function getOrders(sessionId) {
  if (database.enabled) {
    await database.ensureSchema();
    const result = await database.pool.query(
      "SELECT artikelnummer, quantity, color, name, price, image FROM orders WHERE session_id = $1 ORDER BY id",
      [sessionId]
    );
    return result.rows;
  }
  return readJson("orders.json");
}

async function deleteOrder(sessionId, artikelnummer, color) {
  if (database.enabled) {
    await database.ensureSchema();
    await database.pool.query(
      "DELETE FROM orders WHERE session_id = $1 AND artikelnummer = $2 AND color = $3",
      [sessionId, artikelnummer, color]
    );
    return;
  }
  const orders = await readJson("orders.json");
  await writeJson("orders.json", orders.filter((item) => !(item.artikelnummer === artikelnummer && item.color === color)));
}

async function clearOrders(sessionId) {
  if (database.enabled) {
    await database.ensureSchema();
    await database.pool.query("DELETE FROM orders WHERE session_id = $1", [sessionId]);
  } else {
    await writeJson("orders.json", []);
  }
}

async function saveQuote(sessionId, payload) {
  if (database.enabled) {
    await database.ensureSchema();
    const client = await database.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("INSERT INTO quote_requests (payload) VALUES ($1)", [payload]);
      await client.query("DELETE FROM orders WHERE session_id = $1", [sessionId]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    return;
  }
  const quotes = await readJson("offert.json");
  quotes.push({ ...payload, submittedAt: new Date().toISOString() });
  await writeJson("offert.json", quotes);
  await clearOrders(sessionId);
}

async function saveContact(message) {
  if (database.enabled) {
    await database.ensureSchema();
    await database.pool.query(
      "INSERT INTO contact_messages (email, name, phone, message) VALUES ($1, $2, $3, $4)",
      [message.email, message.name, message.phone, message.message]
    );
    return;
  }
  const messages = await readJson("contactMessages.json");
  messages.push({ ...message, timestamp: new Date().toISOString() });
  await writeJson("contactMessages.json", messages);
}

module.exports = { createUser, authenticateUser, addOrder, getOrders, deleteOrder, clearOrders, saveQuote, saveContact };
