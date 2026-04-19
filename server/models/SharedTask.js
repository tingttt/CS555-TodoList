import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const memberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
});

const sharedTaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    due: { type: String, default: '' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    category: { type: String, default: '' },
    completed: { type: Boolean, default: false },
    owner: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      name: { type: String, required: true },
      email: { type: String, required: true },
    },
    members: [memberSchema],
    comments: [commentSchema],
  },
  { timestamps: true }
);

const SharedTask = mongoose.model('SharedTask', sharedTaskSchema);
export default SharedTask;
