import express from 'express';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Task from './models/Task.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', CLIENT_ORIGIN);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());

// ── MongoDB ───────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// ── Session ───────────────────────────────────────────────────────────────────
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI, collectionName: 'sessions', ttl: 86400 }),
  cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 86400000 },
});
app.use(sessionMiddleware);

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new SocketIO(httpServer, { cors: { origin: CLIENT_ORIGIN, credentials: true } });
io.use((socket, next) => sessionMiddleware(socket.request, {}, next));
io.on('connection', (socket) => {
  const userId = socket.request.session?.userId?.toString();
  if (userId) socket.join(userId);
});

function emitToUser(userId, event, data) {
  io.to(userId.toString()).emit(event, data);
}

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session?.userId) return res.status(401).json({ message: 'Not authenticated' });
  next();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields are required.' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'An account with this email already exists.' });
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashedPassword });
    req.session.userId = user._id;
    req.session.userName = user.name;
    return res.status(201).json({ message: 'Account created.', user: { userId: user._id, name: user.name, email: user.email, reminderDays: user.reminderDays, myName: user.myName, darkMode: user.darkMode, sortBy: user.sortBy } });
  } catch (err) {
    return res.status(500).json({ message: 'Server error during signup.' });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password.' });
    req.session.userId = user._id;
    req.session.userName = user.name;
    return res.json({ message: 'Signed in.', user: { userId: user._id, name: user.name, email: user.email, reminderDays: user.reminderDays, myName: user.myName, darkMode: user.darkMode, sortBy: user.sortBy } });
  } catch (err) {
    return res.status(500).json({ message: 'Server error during signin.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: 'Could not log out.' });
    res.clearCookie('connect.sid');
    return res.json({ message: 'Logged out.' });
  });
});

app.get('/api/auth/me', async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ authenticated: false });
  try {
    const user = await User.findById(req.session.userId).select('-password');
    if (!user) return res.status(401).json({ authenticated: false });
    return res.json({ authenticated: true, userId: user._id, name: user.name, email: user.email, reminderDays: user.reminderDays, myName: user.myName, darkMode: user.darkMode, sortBy: user.sortBy });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════════════════════════════

app.get('/api/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('-password');
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

app.patch('/api/profile', requireAuth, async (req, res) => {
  try {
    const { name, email, oldPassword, newPassword, reminderDays, myName, darkMode, sortBy } = req.body;
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (name !== undefined) user.name = name.trim();
    if (email !== undefined) {
      const emailLower = email.toLowerCase().trim();
      if (emailLower !== user.email) {
        const taken = await User.findOne({ email: emailLower });
        if (taken) return res.status(409).json({ message: 'Email already in use.' });
        user.email = emailLower;
      }
    }
    if (newPassword) {
      if (!oldPassword) return res.status(400).json({ message: 'Current password is required.' });
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect.' });
      if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters.' });
      user.password = await bcrypt.hash(newPassword, 12);
    }
    if (reminderDays !== undefined) user.reminderDays = Number(reminderDays);
    if (myName !== undefined) user.myName = myName;
    if (darkMode !== undefined) user.darkMode = Boolean(darkMode);
    if (sortBy !== undefined) user.sortBy = sortBy;
    await user.save();
    req.session.userName = user.name;
    return res.json({ message: 'Profile updated.', user: { userId: user._id, name: user.name, email: user.email, reminderDays: user.reminderDays, myName: user.myName, darkMode: user.darkMode, sortBy: user.sortBy } });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════════
// USER SEARCH
// ═══════════════════════════════════════════════════════════════════

app.get('/api/users/search', requireAuth, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json([]);
    const users = await User.find({
      $or: [{ name: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }],
    }).select('name email').limit(8);
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════════
// PERSONAL TASKS
// ═══════════════════════════════════════════════════════════════════

// My own tasks
app.get('/api/tasks', requireAuth, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.session.userId }).sort({ order: 1, createdAt: 1 });
    // Normalise: ensure every task has a comments array (backfills old docs without it)
    const normalised = tasks.map((t) => {
      const obj = t.toObject();
      if (!obj.comments) obj.comments = [];
      return obj;
    });
    return res.json(normalised);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

// Tasks shared with me by others
app.get('/api/tasks/shared-with-me', requireAuth, async (req, res) => {
  try {
    const tasks = await Task.find({
      userId: { $ne: req.session.userId },
      isShared: true,
      'sharedWith.userId': req.session.userId,
    }).sort({ createdAt: -1 });

    // Attach the owner name to each task so the frontend can display "Shared by X"
    const ownerIds = [...new Set(tasks.map((t) => t.userId.toString()))];
    const owners = await User.find({ _id: { $in: ownerIds } }).select('name');
    const ownerMap = Object.fromEntries(owners.map((u) => [u._id.toString(), u.name]));

    const tasksWithOwner = tasks.map((t) => ({
      ...t.toObject(),
      ownerName: ownerMap[t.userId.toString()] || 'Someone',
    }));

    const normalisedShared = tasksWithOwner.map((t) => ({ ...t, comments: t.comments || [] }));
    return res.json(normalisedShared);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

app.post('/api/tasks', requireAuth, async (req, res) => {
  try {
    const { title, description, due, priority, category, assignedTo, isShared, sharedWith } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required.' });

    // Resolve assignedTo — default to the creator if not provided
    const creator = await User.findById(req.session.userId).select('name email');
    const resolvedAssignedTo = (assignedTo && typeof assignedTo === 'object' && assignedTo.userId)
      ? assignedTo
      : { userId: creator._id, name: creator.name, email: creator.email };

    const count = await Task.countDocuments({ userId: req.session.userId });
    const task = await Task.create({
      userId: req.session.userId,
      creatorName: creator.name,
      creatorEmail: creator.email,
      title,
      description: description || '',
      due: due || '',
      priority: priority || 'low',
      category: category || '',
      assignedTo: resolvedAssignedTo,
      isShared: isShared || false,
      sharedWith: sharedWith || [],
      completed: false,
      order: count,
    });
    // Notify creator
    emitToUser(req.session.userId, 'task:created', task);
    // Notify each person it's shared with — include ownerName for display
    if (task.isShared && task.sharedWith.length > 0) {
      const taskWithOwner = { ...task.toObject(), ownerName: creator.name };
      task.sharedWith.forEach((u) => emitToUser(u.userId, 'task:shared-with-me', taskWithOwner));
    }
    return res.status(201).json(task);
  } catch (err) {
    console.error('Create task error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

app.patch('/api/tasks/:id', requireAuth, async (req, res) => {
  try {
    // Allow owner OR someone the task is shared with to patch it
    const task = await Task.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.session.userId },
        { isShared: true, 'sharedWith.userId': req.session.userId },
      ],
    });
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const requesterId = req.session.userId.toString();
    // Owner = creator OR the assigned user (if set, otherwise creator is assigned by default)
    const isOwner = task.userId.toString() === requesterId ||
      (task.assignedTo?.userId && task.assignedTo.userId.toString() === requesterId);

    if (isOwner) {
      // Owner/assignee can edit everything
      const allowed = ['title', 'description', 'due', 'priority', 'category', 'completed', 'order', 'isShared', 'sharedWith', 'notes'];
      allowed.forEach((field) => { if (req.body[field] !== undefined) task[field] = req.body[field]; });
      if (req.body.assignedTo !== undefined) {
        const at = req.body.assignedTo;
        task.assignedTo = (at && typeof at === 'object' && at.userId) ? at : null;
      }
    } else {
      // Shared member — can only toggle completed
      if (req.body.completed !== undefined) task.completed = req.body.completed;
    }
    await task.save();

    // Notify owner
    emitToUser(task.userId, 'task:updated', task);
    // Notify all shared-with users (include ownerName so UI can display "Shared by X")
    if (task.isShared && task.sharedWith.length > 0) {
      const ownerUser = await User.findById(task.userId).select('name').catch(() => null);
      const taskWithOwner = { ...task.toObject(), ownerName: ownerUser?.name || 'Someone' };
      task.sharedWith.forEach((u) => {
        if (u.userId.toString() !== task.userId.toString()) {
          emitToUser(u.userId, 'task:updated', taskWithOwner);
        }
      });
    }
    return res.json(task);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

app.delete('/api/tasks/:id', requireAuth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.session.userId });
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    emitToUser(req.session.userId, 'task:deleted', { _id: req.params.id });
    if (task.isShared && task.sharedWith.length > 0) {
      task.sharedWith.forEach((u) => emitToUser(u.userId, 'task:deleted', { _id: req.params.id }));
    }
    return res.json({ message: 'Task deleted.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

app.post('/api/tasks/reorder', requireAuth, async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) return res.status(400).json({ message: 'orderedIds must be an array.' });
    const bulkOps = orderedIds.map((id, index) => ({ updateOne: { filter: { _id: id, userId: req.session.userId }, update: { $set: { order: index } } } }));
    await Task.bulkWrite(bulkOps);
    emitToUser(req.session.userId, 'task:reordered', { orderedIds });
    return res.json({ message: 'Reordered.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

// Invite link join — someone opens /shared/:taskId
app.get('/api/tasks/join/:id', requireAuth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    if (!task.isShared) return res.status(403).json({ message: 'This task is not shared.' });

    const userId = req.session.userId;
    const alreadyIn = task.userId.toString() === userId.toString() ||
      task.sharedWith.some((u) => u.userId.toString() === userId.toString());
    if (!alreadyIn) {
      const user = await User.findById(userId).select('name email');
      task.sharedWith.push({ userId: user._id, name: user.name, email: user.email });
      await task.save();
      emitToUser(task.userId, 'task:updated', task);
      task.sharedWith.forEach((u) => {
        if (u.userId.toString() !== userId.toString()) emitToUser(u.userId, 'task:updated', task);
      });
      emitToUser(userId, 'task:shared-with-me', task);
    }
    return res.json(task);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════════
// TASK COMMENTS (for isShared personal tasks)
// ═══════════════════════════════════════════════════════════════════

// Helper: is this user allowed to interact with comments on this task?
function canComment(task, userId) {
  const id = userId.toString();
  // Owner can always comment; sharedWith members can comment on shared tasks
  if (task.userId.toString() === id) return true;
  if (task.isShared && task.sharedWith.some((u) => u.userId.toString() === id)) return true;
  return false;
}

// POST a comment
app.post('/api/tasks/:id/comments', requireAuth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    if (!canComment(task, req.session.userId))
      return res.status(403).json({ message: 'Not allowed to comment on this task.' });
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment cannot be empty.' });
    const user = await User.findById(req.session.userId).select('name');
    // Guard: older documents in MongoDB may not have the comments array yet
    if (!task.comments) task.comments = [];
    task.comments.push({ userId: req.session.userId, name: user.name, text: text.trim() });
    await task.save();
    const newComment = task.comments[task.comments.length - 1];
    // Notify owner + all sharedWith members + commenter (deduplicated)
    const involvedIds = [task.userId, ...task.sharedWith.map((u) => u.userId), req.session.userId];
    const seen = new Set();
    const notifyIds = involvedIds.filter((uid) => {
      const key = uid.toString();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    notifyIds.forEach((uid) =>
      emitToUser(uid, 'task:comment', { taskId: task._id.toString(), comment: newComment })
    );
    return res.status(201).json(newComment);
  } catch (err) {
    console.error('Add comment error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE a comment — only the comment author can delete (owner cannot delete others' comments per spec)
app.delete('/api/tasks/:id/comments/:commentId', requireAuth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    if (!task.comments) task.comments = [];
    const comment = task.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });
    // Task owner can delete any comment; other users can only delete their own
    const requesterId = req.session.userId.toString();
    const isTaskOwner = task.userId.toString() === requesterId;
    const isCommentAuthor = comment.userId.toString() === requesterId;
    if (!isTaskOwner && !isCommentAuthor)
      return res.status(403).json({ message: 'You can only delete your own comments.' });
    comment.deleteOne();
    await task.save();
    const involvedIds2 = [task.userId, ...task.sharedWith.map((u) => u.userId), req.session.userId];
    const seen2 = new Set();
    const notifyIds = involvedIds2.filter((uid) => {
      const key = uid.toString();
      if (seen2.has(key)) return false;
      seen2.add(key);
      return true;
    });
    notifyIds.forEach((uid) =>
      emitToUser(uid, 'task:comment-deleted', { taskId: task._id.toString(), commentId: req.params.commentId })
    );
    return res.json({ message: 'Comment deleted.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
