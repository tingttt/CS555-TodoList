import mongoose from 'mongoose';

const assignedUserSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name:   { type: String },
  email:  { type: String },
}, { _id: false });

const sharedWithSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:   { type: String, required: true },
  email:  { type: String, required: true },
}, { _id: false });

// Comments on shared personal tasks (tasks with isShared: true)
const commentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name:   { type: String, required: true },
    text:   { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Denormalized creator info — stored once at creation for fast display
    creatorName:  { type: String, default: '' },
    creatorEmail: { type: String, default: '' },

    title:       { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    due:         { type: String, default: '' },   // stored as "mm/dd/yyyy"
    priority:    { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    category:    { type: String, default: '' },

    // Assigned-to is now a registered user object (nullable)
    assignedTo:  { type: assignedUserSchema, default: null },

    // Sharing
    isShared:   { type: Boolean, default: false },
    sharedWith: { type: [sharedWithSchema], default: [] },

    // Comments — populated when isShared is true; members & owner can comment
    comments: { type: [commentSchema], default: [] },

    notes:     { type: String, default: '' },
    completed: { type: Boolean, default: false },
    order:     { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Task = mongoose.model('Task', taskSchema);
export default Task;
