import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { MongoClient, ObjectId } from "mongodb";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "quickcrm";
const PORT = Number(process.env.PORT) || 3000;

const client = new MongoClient(MONGO_URI);
const db = client.db(DB_NAME);
const leads = db.collection("leads");

const app = new Hono();

// API routes
const api = new Hono();

// Get all leads
api.get("/leads", async (c) => {
  const all = await leads.find().sort({ created: -1 }).toArray();
  return c.json(all);
});

// Create lead
api.post("/leads", async (c) => {
  const body = await c.req.json();
  body.created = new Date().toISOString();
  body.updated = new Date().toISOString();
  const result = await leads.insertOne(body);
  return c.json({ ...body, _id: result.insertedId }, 201);
});

// Bulk create leads
api.post("/leads/bulk", async (c) => {
  const items = await c.req.json();
  const now = new Date().toISOString();
  const docs = items.map((item: Record<string, unknown>) => ({
    ...item,
    created: now,
    updated: now,
  }));
  const result = await leads.insertMany(docs);
  return c.json({ count: result.insertedCount }, 201);
});

// Update lead
api.put("/leads/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  body.updated = new Date().toISOString();
  await leads.updateOne({ _id: new ObjectId(id) }, { $set: body });
  return c.json({ ok: true });
});

// Delete lead
api.delete("/leads/:id", async (c) => {
  const id = c.req.param("id");
  await leads.deleteOne({ _id: new ObjectId(id) });
  return c.json({ ok: true });
});

app.route("/api", api);

// Serve static files from public/
app.use("/*", serveStatic({ root: "./public" }));

// Start
async function main() {
  console.log(`[config] MONGODB_URI=${process.env.MONGODB_URI ?? "(unset)"}`);
  console.log(`[config] DB_NAME=${process.env.DB_NAME ?? "(unset)"}`);
  console.log(`[config] PORT=${process.env.PORT ?? "(unset)"}`);
  console.log(`[mongo] connecting to ${MONGO_URI} ...`);

  await client.connect();
  console.log(`[mongo] connected, using db "${DB_NAME}"`);

  // Ensure index
  await leads.createIndex({ status: 1 });
  await leads.createIndex({ created: -1 });

  serve({ fetch: app.fetch, port: PORT }, () => {
    console.log(`[server] running on http://localhost:${PORT}`);
  });
}

main().catch(console.error);
