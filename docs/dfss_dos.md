# Distributed File Storage System (DFSS)
## Research Documentation and Project Design Guide

### Purpose
This document explains the concepts required to design and present a small distributed file storage system. It covers architecture, chunking, placement, replication, fault tolerance, metadata, consistency, security, performance, and comparisons with existing systems.

## 1. Executive Summary

A Distributed File Storage System stores one logical file across multiple networked storage nodes instead of depending on one central machine. A large file is divided into chunks, the chunks are placed on suitable nodes, and replicas are created so that the file remains available when a node, disk, or network connection fails.

The main design challenge is coordination: the system must know which chunks belong to a file, where every replica is located, whether nodes are healthy, and how to reconstruct the original file in the correct order. A practical student project can implement a coordinator/metadata service, several storage-node processes, a database such as MongoDB, chunk upload/download APIs, replication, checksums, and a monitoring dashboard.

A useful project policy is:

- Fixed chunk size: 4–16 MB for a local demonstration; use a configurable value.
- Replication factor: 3 when at least three nodes are available; use 2 or 1 in a small test cluster.
- Placement: hash-based initial placement plus capacity and failure checks.
- Consistency: strong metadata consistency and read-after-write behavior for completed uploads.
- Integrity: SHA-256 for the complete file and every chunk.
- Recovery: heartbeat-based failure detection followed by re-replication.

HDFS illustrates the basic model: files are divided into blocks stored on DataNodes, and blocks are replicated for fault tolerance. Its documentation identifies 128 MB as a typical block size and makes block size and replication factor configurable. [web:1]

## 2. What Is a Distributed File System?

A distributed file system (DFS) is software that provides a single file-oriented interface while storing data across multiple independent computers. To the user, the system may look like one file system. Internally, the file may be divided into chunks and stored on different nodes.

Important characteristics are:

- Transparency: users do not need to know the physical node holding each chunk.
- Distribution: data is spread across multiple machines.
- Scalability: storage capacity can grow by adding nodes.
- Fault tolerance: replicas allow operation despite selected failures.
- Coordination: metadata and node state must be managed consistently.
- Network dependence: file operations require communication between components.

A DFS is different from simply sharing a folder over a network. A basic network share may depend heavily on one server. A distributed system deliberately distributes data and control responsibilities and includes mechanisms for placement, replication, failure handling, and recovery.

## 3. Why Distributed Storage Is Needed

Centralized storage is simple, but one server can become a capacity, performance, and availability bottleneck. Distributed storage addresses these issues:

- Capacity: many disks can be combined into one logical storage pool.
- Scalability: nodes can be added incrementally.
- Availability: replicas can serve data when one node fails.
- Throughput: different chunks can be read or written in parallel.
- Geographic or rack resilience: replicas can be placed in separate failure domains.
- Maintenance: individual nodes can be upgraded or replaced without stopping the entire service.

Distributed storage also introduces costs: network traffic, metadata coordination, duplicate storage, operational complexity, and difficult failure scenarios.

### Centralized vs distributed storage

| Dimension | Centralized file storage | Distributed file storage |
|---|---|---|
| Physical location | Usually one main server or storage system | Multiple storage nodes |
| Management | Simpler | Requires coordination and metadata management |
| Scaling | Often vertical: bigger server | Horizontal: add nodes |
| Failure impact | Server failure may affect all files | Replicas can limit failure impact |
| Performance | Can bottleneck at one server | Parallel operations may improve throughput |
| Network overhead | Generally lower internally | Higher because nodes communicate |
| Cost | Easier to start | More infrastructure and software complexity |
| Best fit | Small, simple workloads | Large, highly available workloads |

## 4. Basic DFSS Architecture

A project-level architecture can contain these components:

```text
                 Client
                   │
        Upload/download request
                   │
                   ▼
        ┌────────────────────┐
        │ Coordinator/API    │
        │ Authentication     │
        │ Placement logic    │
        └─────────┬──────────┘
                  │
                  ▼
        ┌────────────────────┐
        │ Metadata service   │
        │ File/chunk mapping │
        │ Node registry      │
        └──────┬─────────────┘
               │
      ┌────────┼────────┐
      ▼        ▼        ▼
   Node 1    Node 2    Node 3
   chunks    chunks    replicas
```

### Main components

**Client.** Selects a file, sends upload requests, receives file IDs and status, and downloads chunks or a reconstructed file.

**Coordinator/API server.** Authenticates requests, validates files, creates file metadata, chooses nodes, coordinates uploads and downloads, and starts recovery actions.

**Metadata service/database.** Records file-to-chunk order and chunk-to-node locations. It should be treated as a critical component and protected with backups or high availability.

**Storage node.** A machine or process that stores chunk files on local disk and exposes operations such as store, read, delete, checksum, and health reporting.

**Health monitor.** Sends or receives heartbeats, tracks node status, and records capacity, disk usage, latency, and recent failures.

**Recovery worker.** Detects under-replicated chunks and creates new replicas from healthy copies.

## 5. Storage Nodes and File Placement

A storage node is a participating machine or service with local storage, a network address, an identifier, and a defined amount of available capacity. A node may also report CPU, RAM, disk usage, rack/zone, and health status.

A placement decision answers: “Which nodes should store this chunk?” A good placement algorithm considers:

- Node health: do not select offline or unhealthy nodes.
- Free capacity: avoid filling a node beyond its safe threshold.
- Replication separation: place replicas on different nodes and, if possible, different racks or zones.
- Load: avoid nodes receiving too many concurrent operations.
- Locality: place data close to expected users or compute resources when relevant.
- Determinism: the system should be able to reproduce or verify placement.

### Simple placement approach

1. Generate a unique file ID.
2. Split the file into ordered chunks.
3. For each chunk, calculate a placement score for eligible nodes.
4. Select the best primary node.
5. Select replica nodes while avoiding duplicate node IDs and failure domains.
6. Record the selected locations in metadata.
7. Upload and verify the chunk on the selected nodes.
8. Mark the chunk complete only after the required write policy succeeds.

A simple score might be:

\[
Score(node) = w_1 CapacityScore + w_2 LoadScore + w_3 HealthScore + w_4 LocalityScore
\]

The weights are project parameters. For a basic prototype, round-robin plus a free-space check is easier to explain. For a more advanced design, consistent hashing can reduce movement when nodes join or leave.

## 6. File Chunking

Chunking means splitting one logical file into smaller pieces. If the file is 25 MB and the chunk size is 10 MB, the result is three chunks: 10 MB, 10 MB, and 5 MB.

```text
Original file
      │
      ▼
   Chunker
      │
 ┌────┼────┐
 ▼    ▼    ▼
 C1   C2   C3
 │    │    │
 ▼    ▼    ▼
 N1   N2   N3
```

### Why split files?

- Chunks can be distributed across nodes.
- Chunks can be uploaded or downloaded in parallel.
- Failed chunks can be recovered without copying the entire file.
- Large files can be handled using bounded memory.
- Replication and integrity checks can be performed per chunk.
- Deduplication can operate on repeated content.

### Fixed-size vs variable-size chunks

| Feature | Fixed-size chunks | Variable/content-defined chunks |
|---|---|---|
| Boundary rule | Every chunk has a configured maximum size | Boundaries depend on content patterns |
| Implementation | Simple | More complex |
| Metadata | Predictable | More variable |
| Parallel processing | Easy | Also possible, but less predictable |
| Deduplication | Weaker when bytes are inserted early | Better for shifted content |
| Student prototype | Recommended | Advanced extension |

For an academic prototype, fixed-size chunks are recommended. A size of 4–16 MB keeps demonstrations fast and creates enough chunks to show distribution. Production systems use different sizes based on workload; HDFS documentation gives 128 MB as a typical block size, not a universal rule. [web:1]

### Chunk identity and metadata

A chunk should have a stable identifier. Two common choices are:

- Location-oriented ID: `file_id + chunk_index + version`.
- Content-oriented ID: SHA-256 digest of the chunk.

A practical design can use both. `chunk_id` identifies the logical chunk position, while `content_hash` verifies bytes and enables deduplication.

Example metadata:

```json
{
  "file_id": "f_1001",
  "file_name": "movie.mp4",
  "file_size": 26214400,
  "chunk_size": 10485760,
  "chunk_count": 3,
  "file_sha256": "...",
  "status": "complete",
  "chunks": [
    {
      "chunk_index": 0,
      "chunk_id": "f_1001_c_0000",
      "size": 10485760,
      "sha256": "...",
      "replicas": ["node_1", "node_2"],
      "state": "complete"
    }
  ]
}
```

### Reconstructing a file

1. Retrieve file metadata.
2. Sort chunks by `chunk_index`.
3. Select a healthy replica for each chunk.
4. Verify each downloaded chunk hash.
5. Write bytes sequentially into the output file.
6. Calculate the reconstructed file’s SHA-256.
7. Compare it with the stored `file_sha256`.
8. Report success only if all checks pass.

If one chunk is missing, the system should try another replica. If every replica is missing, reconstruction fails and the file is incomplete. The system should report the missing chunk clearly rather than returning a silently corrupted file.

## 7. Replication

Replication stores multiple copies of a chunk on different storage nodes. The replication factor is the desired number of copies. For example, a factor of 3 means each chunk should have three replicas.

HDFS stores files as sequences of blocks and replicates those blocks for fault tolerance; DataNodes perform replication according to instructions from the NameNode. [web:1] GFS similarly uses multiple chunk replicas and can create a replacement when a chunkserver fails or a replica becomes stale or corrupted. [web:15]

### Primary and replica

The primary is the replica selected for coordination or mutation. Replicas are additional copies used for reads and recovery. A system does not necessarily need a permanent primary for immutable files, but defining one simplifies versioning and write coordination.

### Synchronous vs asynchronous replication

**Synchronous replication** waits until the required replicas acknowledge the write before confirming success. It provides stronger durability but increases latency and can reduce availability during failures.

**Asynchronous replication** confirms after one primary or a smaller write quorum acknowledges, then copies data to other nodes in the background. It offers lower latency but creates a window in which a failure may lose the newest copy.

A clear prototype policy is: write to the primary and at least one replica before marking a chunk durable; complete the remaining replicas asynchronously if the project prioritizes availability and speed. Alternatively, wait for all replicas if strong durability is the main goal.

### Node failure example

Suppose Chunk A exists on Node 1, Node 2, and Node 3, and Node 2 goes offline:

1. The heartbeat monitor marks Node 2 suspect or offline after a timeout.
2. The metadata service removes Node 2 from the healthy read candidates.
3. The client reads Chunk A from Node 1 or Node 3.
4. The recovery worker notices that the actual replica count is 2 while the desired count is 3.
5. It selects a healthy destination, such as Node 4.
6. It copies and verifies Chunk A on Node 4.
7. Metadata is updated to include Node 4.
8. The chunk becomes fully replicated again.

If Node 2 returns, the system should not blindly trust its old data. It should compare versions or checksums and mark stale data for repair or deletion.

## 8. Fault Tolerance and Failure Handling

Distributed systems experience partial failure: one component fails while others continue working. Common failure types include:

- Node failure: a server process or machine stops responding.
- Disk failure: stored bytes become inaccessible or corrupted.
- Network failure: nodes are alive but cannot communicate.
- Coordinator failure: the metadata service becomes unavailable.
- Client failure: an upload stops midway.
- Replica inconsistency: replicas contain different versions.

### Heartbeats

A heartbeat is a periodic message such as “I am alive” sent by a node to the coordinator. The coordinator records the last successful heartbeat. If no heartbeat arrives within a configured interval, the node becomes suspect. After additional checks, it may be marked offline.

A heartbeat should not be the only health signal. A process may answer heartbeats while its disk is full or its data service is broken. Add an application-level health check that verifies disk availability and a small read/write operation.

Example node states:

```text
ONLINE → SUSPECT → OFFLINE
   ▲                  │
   └── RECOVERING ◄───┘
```

### Recovery rules

- Never select offline nodes for new writes.
- Continue reads from healthy replicas.
- Re-replicate chunks whose replica count is below the target.
- Use checksums before accepting copied data.
- Keep repair jobs rate-limited so recovery does not overload the cluster.
- Preserve metadata until the system confirms the replacement replica.
- Log every recovery action for auditing.

Replication improves availability, but it does not protect against every event. If all replicas are deleted, a whole cluster is lost, or an attacker corrupts every copy, an independent backup is required.

## 9. Hashing and Consistent Hashing

A hash function converts an input into a fixed-length value. Hashing can help place a file or chunk deterministically:

```text
hash(chunk_id) mod number_of_nodes = selected_node_index
```

This basic modulo approach has a major weakness: adding or removing one node changes the result for many keys, causing extensive data movement.

### Consistent hashing

Consistent hashing arranges hash values on a circular ring. Nodes occupy positions on the ring, and a chunk is assigned to the next node clockwise from the chunk’s hash position. When a node is added or removed, mainly the keys in its nearby ring interval move rather than all keys. This minimizes redistribution. [web:38]

Virtual nodes place each physical node at multiple positions on the ring. They improve balance when node identifiers or capacities differ.

Consistent hashing is useful for initial ownership, but replication still requires selecting additional nodes and separating them across failure domains. For a small project, implement round-robin first, then demonstrate consistent hashing as an extension.

### CRUSH comparison

Ceph uses the CRUSH algorithm to determine storage locations for object replicas. A client maps an object to a pool and placement group and uses the CRUSH map to identify the primary OSD. [web:8] This demonstrates a more advanced placement approach that can use cluster topology and avoid centralized placement for every read.

## 10. Metadata Management

Metadata is information describing data rather than the file bytes themselves. In DFSS, metadata answers:

- What is the file’s logical name and ID?
- How large is it?
- How many chunks exist?
- What is the order of those chunks?
- Which nodes hold each replica?
- What are the chunk hashes and versions?
- Is the upload complete?
- Which user owns or may access it?

### Suggested MongoDB collections

**files**

```json
{
  "_id": "f_1001",
  "owner_id": "u_20",
  "name": "report.pdf",
  "size": 5242880,
  "chunk_size": 4194304,
  "chunk_count": 2,
  "file_sha256": "...",
  "status": "complete",
  "created_at": "..."
}
```

**chunks**

```json
{
  "_id": "f_1001_c_0000",
  "file_id": "f_1001",
  "chunk_index": 0,
  "size": 4194304,
  "sha256": "...",
  "version": 1,
  "replicas": [
    {"node_id": "node_1", "state": "complete"},
    {"node_id": "node_2", "state": "complete"}
  ]
}
```

**nodes**

```json
{
  "_id": "node_1",
  "address": "10.0.0.11:8001",
  "status": "online",
  "capacity_bytes": 107374182400,
  "used_bytes": 32212254720,
  "last_heartbeat": "...",
  "zone": "zone_a"
}
```

### Metadata consistency

Metadata updates should be state-based, not informal. Useful chunk states are `planned`, `uploading`, `complete`, `under_replicated`, `stale`, and `failed`. A file should become `complete` only when every required chunk has the required durability and verified checksum.

The metadata service is a potential single point of failure. HDFS addresses this through redundant NameNodes in an active/standby configuration with a hot standby. [web:16] A student project can begin with one coordinator and add metadata backups, transactions, or a replicated database later.

## 11. Data Consistency

Consistency describes what users observe when data is replicated or modified.

- Strong consistency: a successful read returns the latest committed version.
- Eventual consistency: replicas may temporarily differ but converge later.
- Read-after-write consistency: after a successful write, the writer can read its new data.
- Version consistency: each update carries a monotonically increasing version or generation number.

For immutable uploaded files, consistency is easier: after the file is marked complete, chunks never change. If your system supports overwrite, use versions. A write should create version 2 rather than modifying version 1 in place. The metadata service can then atomically change the active version after all required chunks are stored.

If two clients update the same file concurrently, possible solutions include:

- Rejecting updates when the client’s version is old.
- Using a coordinator-assigned version and serializing writes.
- Creating separate versions and requiring conflict resolution.
- Using a lease or lock for a limited period.

## 12. CAP Theorem and Project Trade-off

CAP refers to Consistency, Availability, and Partition tolerance. During a network partition, a system must choose whether to reject uncertain operations to protect consistency or continue serving requests with a risk of stale or conflicting data. CAP does not mean a system permanently chooses only two letters; the trade-off becomes unavoidable when a partition occurs. [web:23]

For a student DFSS, a defensible design is:

- Partition tolerance: required because network failures are possible.
- Consistency: prioritized for metadata and completed-file reads.
- Availability: maintained for reads when at least one verified replica is reachable.

Therefore, the project is best described as **partition-tolerant and consistency-oriented for metadata, with availability for reads through replicas**. During a coordinator or metadata partition, new writes may be rejected rather than creating conflicting file-to-chunk mappings. Existing files can still be read if their metadata is cached or available.

Do not claim that replication automatically provides both perfect consistency and perfect availability. It only improves the probability that a valid copy remains accessible.

## 13. Consensus and Coordination

Coordination makes multiple nodes behave as one system. Leader election chooses a coordinator responsible for decisions. Consensus protocols such as Raft allow nodes to agree on an ordered log of state changes despite failures. Systems such as ZooKeeper and etcd are commonly used for coordination in larger deployments.

A simple prototype can use one coordinator and avoid implementing consensus. Explain the limitation clearly: if the coordinator fails, data nodes may still contain chunks, but clients may not know the correct mapping or may be unable to safely accept new writes.

An advanced version can use:

- Active and standby coordinators.
- A replicated metadata database.
- A leader lease.
- A write-ahead log.
- Automatic failover.

## 14. Security and Integrity

Security should cover both access and correctness.

### Authentication and authorization

- Authenticate users with tokens or sessions.
- Associate every file with an owner.
- Check permissions before metadata or chunk access.
- Do not expose raw storage-node endpoints publicly without authorization.
- Give nodes credentials for coordinator communication.

### Encryption

- Use TLS for client-to-coordinator and coordinator-to-node traffic.
- Encrypt sensitive files at rest when the threat model requires it.
- Protect encryption keys separately from stored files.

### Validation

- Restrict file size and permitted file types according to project requirements.
- Generate server-side file IDs rather than trusting client-supplied paths.
- Prevent path traversal by never using unsanitized file names as disk paths.
- Apply upload timeouts and quotas.

### SHA-256 integrity

Calculate a SHA-256 digest for every chunk and for the complete file. On read, calculate the received digest and compare it with metadata. A mismatch indicates corruption, a wrong chunk, or an unauthorized modification.

HDFS also verifies checksums when clients retrieve data and can read another replica if the received block does not match its stored checksum. [web:35]

Hashing is for integrity and identification; it is not encryption. Anyone who obtains the file can still read it unless encryption and access control are used.

## 15. Deduplication

Deduplication avoids storing identical content more than once. The system calculates a content hash, looks for an existing chunk with that hash, and stores a reference instead of another copy.

Whole-file deduplication is simple but misses repeated sections inside different files. Chunk-level deduplication saves more space but requires reference counting and careful deletion rules. Never delete a shared chunk until no file references it.

A content identifier can also be used in a content-addressed system. IPFS, for example, uses a CID based on a cryptographic hash; the CID identifies content rather than a physical storage location. [web:25]

## 16. Performance

Measure the system instead of only describing it. Important metrics include:

- Upload throughput: bytes uploaded per second.
- Download throughput: bytes reconstructed per second.
- End-to-end latency: time from request to completion.
- Chunk latency: time for each chunk operation.
- Metadata latency: time to locate file and chunk replicas.
- Parallelism: improvement from concurrent chunk transfers.
- Recovery time: time to restore the desired replica count.
- Storage overhead: replica bytes divided by original bytes.
- Failure read success rate: percentage of downloads completed during node failures.

For a file of size \(F\), chunk size \(B\), and final partial chunk allowed:

\[
Number\ of\ chunks = \lceil F/B \rceil
\]

With replication factor \(R\), approximate raw storage usage is:

\[
Storage\ used \approx F \times R + Metadata\ overhead
\]

Replication increases durability and read options but consumes additional storage and network bandwidth. Parallel downloads can improve throughput, but too many simultaneous requests can overload the network or disks.

## 17. Existing Systems

| System | Main idea | Useful lesson for this project |
|---|---|---|
| Google File System | Large files are split into chunks, stored on chunkservers, and replicated | Master metadata, chunk replication, checksums, and recovery |
| HDFS | Files are split into blocks on DataNodes and managed by NameNode services | Clear master/data-node architecture and configurable block replication |
| Ceph | Objects are mapped using CRUSH to placement groups and OSDs | Decentralized placement and topology-aware replication |
| GlusterFS | Distributed file storage built from storage bricks | Scale-out storage with distributed volumes |
| Amazon S3 | Object storage accessed through an API rather than a traditional mounted file system | Durable object APIs, namespaces, and cloud-scale service design |
| IPFS | Content-addressed, decentralized content retrieval using CIDs | Hash-based identity and location-independent content references |

HDFS documentation describes DataNodes as common block storage providers and reports that they send heartbeats and block reports to NameNodes. [web:19] Ceph documentation similarly emphasizes monitoring OSDs, monitors, placement groups, and metadata servers as cluster health activities. [web:33]

## 18. Recommended Project Design

### Functional requirements

1. User uploads a file.
2. The coordinator creates a file record.
3. The chunker divides the file.
4. The placement service selects nodes.
5. Nodes store chunks and return checksums.
6. Replicas are created according to the replication factor.
7. Metadata records all mappings.
8. User downloads the file.
9. The coordinator retrieves healthy chunks in order.
10. The system verifies chunk and file hashes.
11. The monitor detects node failure.
12. The recovery worker re-replicates affected chunks.

### Suggested API endpoints

```text
POST /files/upload
GET  /files/{file_id}
GET  /files/{file_id}/download
GET  /files/{file_id}/status
POST /nodes/register
POST /nodes/{node_id}/heartbeat
GET  /nodes
POST /admin/rebalance
```

### Storage-node endpoints

```text
PUT    /chunks/{chunk_id}
GET    /chunks/{chunk_id}
HEAD   /chunks/{chunk_id}
DELETE /chunks/{chunk_id}
GET    /health
```

### Upload sequence

```text
Client → Coordinator: upload file
Coordinator → Metadata DB: create file record
Coordinator: split file into chunks
Coordinator → Nodes: upload chunk and replicas
Nodes → Coordinator: size + SHA-256 + acknowledgement
Coordinator → Metadata DB: save locations and states
Coordinator: mark file complete
Coordinator → Client: file ID and success
```

### Download sequence

```text
Client → Coordinator: request file
Coordinator → Metadata DB: obtain ordered chunks
Coordinator → Nodes: choose healthy replica for each chunk
Nodes → Coordinator/client: return chunks
Coordinator: verify hashes and order
Coordinator → Client: reconstructed file
```

## 19. Failure Demonstration for Presentation

Use this scenario during the viva:

1. Upload `report.pdf` with six chunks and replication factor 3.
2. Show that each chunk has three node locations in MongoDB.
3. Stop Storage Node 2.
4. The dashboard changes Node 2 from green to red after missed heartbeats.
5. Download the file while Node 2 is offline.
6. The coordinator chooses Node 1 or Node 3 for affected chunks.
7. SHA-256 verification succeeds.
8. The recovery worker creates replacement copies on a healthy node.
9. The metadata record returns to the desired replication factor.

This demonstration proves distribution, replication, failure detection, availability, integrity, and recovery in one story.

## 20. Limitations to State Honestly

- A single metadata coordinator is a single point of failure.
- Replication factor 2 or 3 does not replace an independent backup.
- A prototype on one laptop may simulate nodes rather than provide true machine-level isolation.
- Network failures cannot always be distinguished from node failures using heartbeats alone.
- Consistent hashing does not automatically balance data if chunk sizes are highly uneven.
- SHA-256 detects accidental changes but does not provide confidentiality.
- No system can guarantee unlimited availability, zero data loss, and strong consistency during every partition.

## 21. Viva Questions and Answers

**What is the main purpose of a distributed file system?**

To store and retrieve one logical file across multiple networked nodes while improving scalability, throughput, and fault tolerance.

**Why split a file into chunks?**

Chunks can be distributed, replicated, transferred in parallel, individually verified, and recovered without copying the complete file.

**What happens if one storage node fails?**

The coordinator marks it unhealthy, reads affected chunks from other replicas, and later re-replicates the chunks to a healthy node.

**Why is metadata important?**

Without file-to-chunk order and chunk-to-node locations, the system cannot reconstruct the file or find its data.

**What is the replication factor?**

The number of intended copies of each chunk. A factor of 3 means three copies, preferably on separate failure domains.

**What is the difference between hashing and encryption?**

Hashing creates a digest for identification or integrity checking; encryption transforms data so only authorized parties can read it.

**Why not use simple modulo hashing everywhere?**

Adding or removing a node changes many assignments. Consistent hashing limits movement to nearby hash ranges.

**Which CAP trade-off does the project make?**

It treats partition tolerance as necessary, prioritizes metadata consistency, and uses replicas to retain read availability where verified copies exist.

**Does replication make storage faster?**

It can improve read throughput by allowing selection among replicas, but it increases write traffic, storage use, and coordination overhead.

## 22. Final Explanation for Group Members

“Our system presents one logical file interface over several storage nodes. During upload, the coordinator divides the file into ordered chunks, calculates hashes, selects healthy nodes, and stores replicas. MongoDB stores metadata describing the file, chunks, versions, hashes, and replica locations. During download, the coordinator selects healthy replicas, retrieves chunks in order, verifies their hashes, and reconstructs the original file. Heartbeats detect unavailable nodes, and a recovery process re-replicates under-replicated chunks. The design improves scalability and availability, but it must manage network overhead, metadata reliability, consistency, security, and the storage cost of replication.”

## Conclusion

A distributed file storage project is not merely a program that saves pieces of a file on different computers. It is a coordinated system that manages data placement, chunk identity, replication, metadata, health, integrity, recovery, and trade-offs between consistency and availability. For a strong academic implementation, begin with fixed-size chunking, a coordinator, three simulated or real storage nodes, MongoDB metadata, replication, SHA-256 verification, heartbeat monitoring, and a failure demonstration. Add consistent hashing, deduplication, authentication, and coordinator high availability as advanced extensions.

## Sources

The main technical references used for this documentation are Apache HDFS Architecture, Apache HDFS High Availability and Federation documentation, Ceph Architecture and Monitoring documentation, Google File System teaching material, IPFS content addressing documentation, and consistent-hashing course material. Key claims are cited inline throughout the document.
