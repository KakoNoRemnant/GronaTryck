# Deploying Grona Tryck to Vercel

## 1. Create the project

Import the Git repository in Vercel. Keep the framework preset as **Other** and the root directory as the repository root. The included `vercel.json` handles the Express function and static files.

Because the static image library is large, deploy through the Vercel Git integration. CLI source uploads on the Hobby plan have a lower size limit.

## 2. Add PostgreSQL

In the Vercel project, open **Storage/Marketplace**, create or connect a PostgreSQL database, and expose its connection string as:

`DATABASE_URL`

The application creates its tables automatically on first use. The database stores users, sessions, carts, quote requests, and contact messages.

## 3. Add the session secret

Create a long random value and add it as this Vercel environment variable:

`SESSION_SECRET`

Set both variables for Production, Preview, and Development, then redeploy.

## 4. Verify after deployment

Open these paths on the deployed domain:

- `/api/health` should return `database: "configured"`.
- `/` should display the homepage with styling and images.
- `/klader` should display the product list.
- Register and log in with a test account.
- Add a product, refresh, and confirm the cart remains available.
- Submit one contact message and one quote request.

Do not use a deployment where `/api/health` reports `local-json`; writable JSON files are only the localhost fallback.
