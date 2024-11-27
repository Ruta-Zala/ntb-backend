import Blog from '../models/blogModel.js';

const validateBlogData = (data) => {
  const errors = [];

  // Check for required fields if they are not provided
  if (!data.title || data.title.trim() === '') {
    errors.push('Title is required.');
  }
  if (!data.description || data.description.trim() === '') {
    errors.push('Description is required.');
  }
  if (!data.author || data.author.trim() === '') {
    errors.push('Author is required.');
  }

  // Tags validation
  if (data.tags) {
    if (!Array.isArray(data.tags)) {
      errors.push('Tags must be an array.');
    } else if (data.tags.length === 0) {
      errors.push('At least one tag is required.');
    } else if (
      data.tags.some((tag) => typeof tag !== 'string' || tag.trim() === '')
    ) {
      errors.push('All tags must be non-empty strings.');
    }
  } else {
    errors.push('At least one tag is required.');
  }

  return errors;
};

// Blog Controllers
export const createBlog = async (req, res) => {
  const { title, description, author, tags } = req.body;

  const errors = validateBlogData(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const newBlog = new Blog({ title, description, author, tags });
    const savedBlog = await newBlog.save();
    return res.status(201).json({
      message: 'Blog created successfully',
      blog: savedBlog,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: 'Error creating blog', error: err.message });
  }
};

export const getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find();
    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBlog = async (req, res) => {
  try {
    const fieldsToValidate = Object.keys(req.body);
    const errors = [];

    if (
      fieldsToValidate.includes('title') &&
      (!req.body.title || req.body.title.trim() === '')
    ) {
      errors.push('Title is required.');
    }

    if (
      fieldsToValidate.includes('description') &&
      (!req.body.description || req.body.description.trim() === '')
    ) {
      errors.push('Description is required.');
    }

    if (
      fieldsToValidate.includes('author') &&
      (!req.body.author || req.body.author.trim() === '')
    ) {
      errors.push('Author is required.');
    }

    if (fieldsToValidate.includes('tags')) {
      if (!Array.isArray(req.body.tags)) {
        errors.push('Tags must be an array.');
      } else if (
        req.body.tags.some(
          (tag) => typeof tag !== 'string' || tag.trim() === '',
        )
      ) {
        errors.push('All tags must be non-empty strings.');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    if (fieldsToValidate.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.status(200).json(blog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.status(200).json({ message: 'Blog deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
