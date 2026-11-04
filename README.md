# Distributed File Storage System

DFSS is a small distributed file-storage prototype. The coordinator stores file and chunk metadata in MongoDB, while separate HTTP storage-node processes store chunk bytes, report health, and provide replicas for recovery.

## Project Layout

- `Frontend/` - React/Vite web application. Browser-storage mode works without the backend; Google Drive is optional.
- `Backend/server/` - Express coordinator, authentication, MongoDB models, file APIs, chunking, and replication.
- `Backend/storage_node/` - Storage-node HTTP server and a launcher for a local multi-node cluster.
- `docs/dfss_dos.md` - DFSS design and research notes.
- `docs/file-stc.md` - The current repository structure.
- `docs/er-diagram.png` - Data-model diagram.

## Run Locally

The frontend can run by itself. From `Frontend/`, run `npm ci` and then `npm run dev`. Files saved in browser-storage mode stay in that browser on that device.

To run the distributed backend, requirements are Node.js 20.12 or newer and MongoDB running locally or remotely.

1. In `Backend/server/`, copy `.env.example` to `.env` and replace both secret placeholders with different random values of at least 32 characters. Set `MONGODB_URI` to your local MongoDB or Atlas connection string.
2. Install and start the coordinator from the project root:

	```powershell
	cd Backend/server
	npm install
	npm start
	```

3. In another terminal, from `Backend/server/`, run `npm run start:nodes` to start three local storage nodes.

The coordinator listens on `http://localhost:4000`; storage nodes use ports 8101-8103. For Atlas, add your current public IP to the cluster IP access list and use a database user in the connection string.

## Deploy the frontend to Netlify

The root `netlify.toml` configures Netlify to build `Frontend/` and publish its Vite output. Connect this GitHub repository to Netlify and deploy the desired branch. Browser-storage mode works without a backend; Google Drive requires `VITE_GOOGLE_CLIENT_ID` in the Netlify environment and the deployed site origin in the Google OAuth client.

The Express coordinator and storage nodes are separate services and are not deployed by this Netlify configuration. To use backend authentication or distributed storage from the deployed frontend, host those services separately and set `VITE_API_BASE_URL` in Netlify to the coordinator's public origin (without a trailing slash). Configure the backend's CORS settings to allow the Netlify site origin.

See [Backend/server/README.md](Backend/server/README.md) for API endpoints and [docs/dfss_dos.md](docs/dfss_dos.md) for the design notes. `.env`, `node_modules/`, and `Backend/storage_node/data/` are local/generated content and should not be committed.
