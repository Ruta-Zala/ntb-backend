import mongoose from 'mongoose';
import slugify from 'slugify'; // Generate slugs for blog titles

const blockSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    type: { type: String, required: true },
    order: { type: Number, required: true },
    content: { type: String },
    image: { type: String }, // Optional image URL
  },
  { _id: false }, // Prevent automatic _id field for block sub-documents
);

const sectionSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    type: { type: String, required: true },
    order: { type: Number, required: true },
    blocks: [blockSchema], // Array of blocks within a section
  },
  { _id: false }, // Prevent automatic _id field for section sub-documents
);

const blogSchema = new mongoose.Schema(
  {
    blogId: { type: String, required: true, unique: true }, // Change to String
    title: { type: String, required: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true },
    short_description: { type: String, required: true, maxlength: 500 },
    author: { type: String, required: true },
    tags: { type: [String], required: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    thumbnail: { type: String, required: false },
    sections: [sectionSchema],
  },
  {
    timestamps: true,
  },
);

// Generate slug from title before saving
blogSchema.pre('save', function (next) {
  if (this.title && (!this.slug || this.isModified('title'))) {
    console.log(`Generating slug for title: ${this.title}`);
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;
