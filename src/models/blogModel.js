import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  tags: { type: [String], required: true },
  author: { type: String, required: true },
  createdDate: { type: Date, default: Date.now },
  updatedDate: { type: Date, default: Date.now },
});

// Automatically update the `updatedDate` field before updating
blogSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedDate: new Date() });
  next();
});

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;
