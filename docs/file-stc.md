# Current Repository Structure

This tree documents files that exist in the project. The design guide describes possible extensions; it is not a list of implemented folders. In particular, this repository currently has a backend API but no frontend client.

```text
DFSS/
|-- docs/
|   |-- dfss_dos.md             # Design and research notes
|   |-- er-diagram.png          # Data-model diagram
|   `-- file-stc.md             # This file
|-- Backend/
|   |-- server/
|   |   |-- config/             # Environment and MongoDB setup
|   |   |-- controllers/        # HTTP request handlers
|   |   |-- middleware/         # Authentication and error handling
|   |   |-- models/             # MongoDB models
|   |   |-- routes/             # API routes
|   |   |-- services/           # Chunking, node, storage, replication logic
|   |   |-- test/               # Backend and storage-node tests
|   |   |-- utils/              # Hashing and file helpers
|   |   |-- .env.example        # Safe local configuration template
|   |   |-- app.js
|   |   |-- package.json
|   |   `-- server.js           # Coordinator entry point
|   `-- storage_node/
|       |-- cluster.js          # Starts a local group of storage nodes
|       |-- server.js           # Storage-node entry point
|       `-- data/               # Generated chunk data; ignored by Git
|-- .gitignore
`-- README.md
```

`Backend/server/.env` and dependency folders such as `Backend/server/node_modules/` are created locally and are not part of the tracked source tree. `Backend/storage_node/data/` is runtime data, not source code.