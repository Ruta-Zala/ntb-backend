import request from 'supertest';
import mongoose from 'mongoose';
import { app, server } from '../../index.js';
import Blog from '../../models/blogModel.js';

// Test database setup
beforeAll(async () => {
  process.env.NODE_ENV = 'test';

  const url = process.env.TEST_MONGO_URI;

  if (mongoose.connection.readyState) {
    await mongoose.disconnect();
  }

  await mongoose.connect(url);

  if (!server.listening) {
    server.listen(30002, () => {
      console.log('Test server running on port 30002');
    });
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (server) {
    server.close(); // Close the server after tests
  }
});

describe('Blog CRUD Operations', () => {
  let blogId;

  it('should create a new blog', async () => {
    const blogData = {
      title: 'Test Blog',
      description: 'Test Description',
      author: 'John Doe',
      tags: ['JavaScript', 'Node.js'],
    };

    const response = await request(app)
      .post('/api/blogs')
      .send(blogData)
      .expect(201);

    // Adjust for wrapped response
    expect(response.body).toHaveProperty('blog');
    expect(response.body.blog).toHaveProperty('_id');
    expect(response.body.blog.title).toBe(blogData.title);
    expect(response.body.blog.description).toBe(blogData.description);
    expect(response.body.blog.author).toBe(blogData.author);

    blogId = response.body.blog._id;
  });

  it('should fail to create a blog without required fields', async () => {
    const invalidBlogData = {
      title: '',
      description: '',
      author: '',
      tags: [],
    };

    const response = await request(app)
      .post('/api/blogs')
      .send(invalidBlogData)
      .expect(400);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        'Title is required.',
        'Description is required.',
        'Author is required.',
        'At least one tag is required.',
      ]),
    );
  });

  it('should get all blogs', async () => {
    const response = await request(app).get('/api/blogs').expect(200);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('should get a blog by ID', async () => {
    const response = await request(app).get(`/api/blogs/${blogId}`).expect(200);

    expect(response.body).toHaveProperty('_id', blogId);
    expect(response.body.title).toBeTruthy();
    expect(response.body.author).toBeTruthy();
  });

  it('should update a blog with partial data', async () => {
    const updatedData = {
      title: 'Updated Test Blog',
      description: 'Updated Description',
      author: 'Jane Doe',
      tags: ['Updated Tag'],
    };

    const response = await request(app)
      .put(`/api/blogs/${blogId}`)
      .send(updatedData)
      .expect(200);

    expect(response.body.title).toBe(updatedData.title);
    expect(response.body.description).toBe(updatedData.description);
    expect(response.body.author).toBe(updatedData.author);
    expect(response.body.tags).toEqual(updatedData.tags);
  });

  it('should fail to update a blog with invalid data', async () => {
    const invalidData = {
      title: '',
      description: '',
      author: '',
    };

    const response = await request(app)
      .put(`/api/blogs/${blogId}`)
      .send(invalidData)
      .expect(400);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        'Title is required.',
        'Description is required.',
        'Author is required.',
      ]),
    );
  });

  it('should delete a blog', async () => {
    const response = await request(app)
      .delete(`/api/blogs/${blogId}`)
      .expect(200);

    expect(response.body.message).toBe('Blog deleted');
  });
});
