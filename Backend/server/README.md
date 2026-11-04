# DFSS Backend

The backend uses Node.js, Express, MongoDB, and separate HTTP storage-node processes. The coordinator stores file/chunk metadata in MongoDB; chunk bytes stay on storage-node disks.

## Start locally

Requirements: Node.js 20.12 or newer and MongoDB running locally or remotely.

1. From this directory, copy `.env.example` to `.env` and set two different secrets of at least 32 characters for `JWT_SECRET` and `NODE_SHARED_SECRET`.
2. Install dependencies with `npm install`.
3. Start the coordinator with `npm start`.
4. In another terminal in this directory, start three local storage nodes with `npm run start:nodes`.

The coordinator listens on `http://localhost:4000`; storage nodes use ports 8101-8103. Set `NODE_COUNT` to run a different number of nodes. `../storage_node/data/` contains local chunk data and is excluded from Git.

## API

- `POST /api/auth/register` creates an account from `name`, `email`, `password`, and optional `phone`, hashes the password, and returns a bearer token and user.
- `POST /api/auth/login` accepts `email` and `password`, then returns a bearer token and user on success.
- `GET /api/auth/me` returns the signed-in user.
- `POST /api/files/upload` accepts multipart form data with a `file` field.
- `GET /api/files` lists the signed-in user's completed files.
- `GET /api/files/:fileId` returns file and replica metadata.
- `GET /api/files/:fileId/status` returns upload and chunk state.
- `GET /api/files/:fileId/download` reconstructs and verifies the file.
- `DELETE /api/files/:fileId` deletes metadata and reachable replicas.
- `GET /api/nodes` lists storage-node health (bearer token required).
- `POST /api/nodes/admin/rebalance` runs a recovery pass (bearer token required).

Passwords must be at least 8 characters and are stored as bcrypt hashes. Accounts created by the earlier email-code-only version do not have password hashes and require an administrator-assisted migration before they can use password sign-in.

Storage nodes register and send heartbeats using `NODE_SHARED_SECRET`. Chunk uploads use a configurable fixed chunk size and replication factor; a file is marked complete only when every chunk has the configured number of verified replicas, or the number of healthy nodes available at upload start if lower.

Run the focused backend tests with `npm test`.