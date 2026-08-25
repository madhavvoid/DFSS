distributed-file-storage/
│
├── client/
│   ├── public/
│   │
│   └── src/
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── Sidebar.jsx
│       │   ├── FileCard.jsx
│       │   ├── FileUpload.jsx
│       │   ├── NodeStatus.jsx
│       │   └── Loading.jsx
│       │
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Files.jsx
│       │   ├── Upload.jsx
│       │   └── StorageNodes.jsx
│       │
│       ├── services/
│       │   └── api.js
│       │
│       ├── context/
│       │   └── AuthContext.jsx
│       │
│       ├── App.jsx
│       └── main.jsx
│
├── server/
│   │
│   ├── config/
│   │   └── db.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── File.js
│   │   ├── FileChunk.js
│   │   ├── ChunkReplica.js
│   │   ├── StorageNode.js
│   │   └── Heartbeat.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── fileController.js
│   │   └── nodeController.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── fileRoutes.js
│   │   └── nodeRoutes.js
│   │
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   │
│   ├── services/
│   │   ├── chunkService.js
│   │   ├── storageService.js
│   │   ├── replicationService.js
│   │   └── nodeService.js
│   │
│   ├── utils/
│   │   ├── hash.js
│   │   └── fileUtils.js
│   │
│   ├── server.js
│   └── .env
│
├── storage-nodes/
│   ├── node1/
│   ├── node2/
│   └── node3/
│
├── docs/
│   ├── ER-Diagram.png
│   ├── Architecture.png
│   ├── Literature-Survey.docx
│   └── Project-Report.docx
│
├── .gitignore
└── README.md