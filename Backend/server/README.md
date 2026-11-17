# DFSS Backend

The backend uses Node.js, Express, MongoDB, and separate HTTP storage-node processes. The coordinator stores file/chunk metadata in MongoDB; chunk bytes stay on storage-node disks.

## Start locally

Requirements: Node.js 20.12 or newer and MongoDB running locally or remotely.

1. From this directory, copy `.env.example` to `.env` and set two different secrets of at least 32 characters for `JWT_SECRET` and `NODE_SHARED_SECRET`. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` to deliver sign-in codes. To enable text-message codes, also set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_PHONE` with a Twilio account.
	Set `ADMIN_EMAILS` to a comma-separated list of administrator email addresses. Each administrator signs in through the regular email-code flow; only verified addresses in this list can access the admin API.
2. Install dependencies with `npm install`.
3. Start the coordinator with `npm start`.
4. In another terminal in this directory, start three local storage nodes with `npm run start:nodes`.

The coordinator listens on `http://localhost:4000`; storage nodes use ports 8101-8103. Set `NODE_COUNT` to run a different number of nodes. `../storage_node/data/` contains local chunk data and is excluded from Git.

## API

- `POST /api/auth/register` creates an account from `name`, `email`, optional `phone`, and optional `password`, then returns a bearer token and user. Passwords are bcrypt-hashed; passwordless clients can continue using email-code sign-in.
- `POST /api/auth/login` accepts `email` and `password`, then returns a bearer token and user. The route is rate-limited.
- `POST /api/auth/admin-login` accepts the same credentials but only returns a session for an email in `ADMIN_EMAILS`.
- `POST /api/auth/set-password` sets or changes a password for the signed-in user. Changing an existing password requires `currentPassword`; use password recovery if it is forgotten.
- `POST /api/auth/request-code` sends an email password-recovery code for `intent: "password-reset"` and the account email in `identifier`.
- `POST /api/auth/reset-password` accepts the email, six-digit recovery code, and new password, then returns a bearer token and user. Codes expire after ten minutes and allow up to five attempts.
- `GET /api/auth/me` returns the signed-in user.
- `GET /api/admin/users` lists registered accounts and their last verified sign-in time (administrator only).
- `GET /api/admin/uploads` lists uploaded file metadata and account owners (administrator only).
- `GET /api/admin/uploads/:fileId/download` reconstructs and verifies an uploaded file (administrator only).
- `POST /api/files/upload` accepts multipart form data with a `file` field.
- `GET /api/files` lists the signed-in user's completed files.
- `GET /api/files/:fileId` returns file and replica metadata.
- `GET /api/files/:fileId/status` returns upload and chunk state.
- `GET /api/files/:fileId/download` reconstructs and verifies the file.
- `DELETE /api/files/:fileId` deletes metadata and reachable replicas.
- `GET /api/nodes` lists storage-node health (bearer token required).
- `POST /api/nodes/admin/rebalance` runs a recovery pass (bearer token required).

Storage nodes register and send heartbeats using `NODE_SHARED_SECRET`. Chunk uploads use a configurable fixed chunk size and replication factor; a file is marked complete only when every chunk has the configured number of verified replicas, or the number of healthy nodes available at upload start if lower.

Run the focused backend tests with `npm test`.