import User from '../models/User.js';
import File from '../models/File.js';

function pagination(query) {
  const requestedLimit = Number.parseInt(query.limit, 10) || 25;
  const limit = Math.min(Math.max(requestedLimit, 1), 100);
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  return { limit, page, skip: (page - 1) * limit };
}

function searchExpression(value) {
  const search = typeof value === 'string' ? value.trim().slice(0, 100) : '';
  return search ? new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
}

export async function listUsers(req, res) {
  const { limit, page, skip } = pagination(req.query);
  const search = searchExpression(req.query.q);
  const filter = search ? { $or: [{ name: search }, { email: search }, { phone: search }] } : {};
  const [users, total] = await Promise.all([
    User.find(filter).select('name email phone createdAt lastLoginAt').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter)
  ]);
  return res.json({
    users: users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email || null,
      phone: user.phone || null,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt || null
    })),
    page,
    limit,
    total
  });
}

export async function listUploads(req, res) {
  const { limit, page, skip } = pagination(req.query);
  const search = searchExpression(req.query.q);
  const filter = search ? { originalName: search } : {};
  const [files, total] = await Promise.all([
    File.find(filter)
      .select('owner originalName size chunkCount replicationFactor status createdAt')
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    File.countDocuments(filter)
  ]);
  return res.json({
    files: files.map((file) => ({
      id: file._id.toString(),
      name: file.originalName,
      size: file.size,
      chunkCount: file.chunkCount,
      replicationFactor: file.replicationFactor,
      status: file.status,
      createdAt: file.createdAt,
      owner: file.owner ? {
        id: file.owner._id.toString(),
        name: file.owner.name,
        email: file.owner.email || null
      } : null
    })),
    page,
    limit,
    total
  });
}