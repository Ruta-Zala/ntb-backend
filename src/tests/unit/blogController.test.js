import {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
} from '../../controllers/blogController';
import Blog from '../../models/blogModel';
import { mockRequest, mockResponse } from 'jest-mock-req-res';

jest.mock('../../models/blogModel');

describe('Blog Controller and Model Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Blog Controller', () => {
    describe('createBlog', () => {
      it('should create a blog successfully', async () => {
        const blogData = {
          title: 'Test Blog',
          description: 'This is a test blog description.',
          author: 'John Doe',
          tags: ['test', 'blog'],
        };

        const req = mockRequest({ body: blogData });
        const res = mockResponse();
        Blog.prototype.save = jest.fn().mockResolvedValue(blogData);

        await createBlog(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Blog created successfully',
          blog: blogData,
        });
      });

      it('should return 400 if data is invalid', async () => {
        const req = mockRequest({ body: {} });
        const res = mockResponse();

        await createBlog(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({ errors: expect.any(Array) }),
        );
      });

      it('should return 500 if database error occurs during creation', async () => {
        const req = mockRequest({
          body: {
            title: 'Test Blog',
            description: 'Test description',
            author: 'Test Author',
            tags: ['tag1'],
          },
        });
        const res = mockResponse();
        Blog.prototype.save = jest
          .fn()
          .mockRejectedValue(new Error('Database error'));

        await createBlog(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Database error',
          message: 'Error creating blog',
        });
      });
    });

    describe('getBlogs', () => {
      it('should fetch all blogs', async () => {
        const req = mockRequest();
        const res = mockResponse();
        const blogData = [
          { title: 'Blog 1', description: 'Desc 1', author: 'Author 1' },
          { title: 'Blog 2', description: 'Desc 2', author: 'Author 2' },
        ];

        Blog.find = jest.fn().mockResolvedValue(blogData);

        await getBlogs(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(blogData);
      });

      it('should return 500 if database error occurs during fetching blogs', async () => {
        Blog.find = jest.fn().mockRejectedValue(new Error('Database error'));
        const req = mockRequest();
        const res = mockResponse();

        await getBlogs(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
      });
    });

    describe('getBlogById', () => {
      it('should fetch a blog by ID', async () => {
        const req = mockRequest({ params: { id: '1' } });
        const res = mockResponse();
        const blogData = {
          title: 'Test Blog',
          description: 'Desc',
          author: 'Author',
        };

        Blog.findById = jest.fn().mockResolvedValue(blogData);

        await getBlogById(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(blogData);
      });

      it('should return 404 if blog not found for the given ID', async () => {
        const req = mockRequest({ params: { id: '999' } });
        const res = mockResponse();
        Blog.findById = jest.fn().mockResolvedValue(null);

        await getBlogById(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Blog not found' });
      });

      it('should return 500 if database error occurs while fetching blog by ID', async () => {
        const req = mockRequest({ params: { id: '1' } });
        const res = mockResponse();
        Blog.findById = jest
          .fn()
          .mockRejectedValue(new Error('Database error'));

        await getBlogById(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
      });
    });

    describe('updateBlog', () => {
      it('should update a blog successfully', async () => {
        const req = mockRequest({
          params: { id: '1' },
          body: { title: 'Updated Title' },
        });
        const res = mockResponse();
        const updatedBlog = {
          title: 'Updated Title',
          description: 'Desc',
          author: 'Author',
        };

        Blog.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedBlog);

        await updateBlog(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(updatedBlog);
      });

      it('should return 404 if blog not found for updating', async () => {
        const req = mockRequest({
          params: { id: '999' },
          body: { title: 'Updated Title' },
        });
        const res = mockResponse();
        Blog.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

        await updateBlog(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Blog not found' });
      });

      it('should return 400 if no data provided for update', async () => {
        const req = mockRequest({ params: { id: '1' }, body: {} });
        const res = mockResponse();

        await updateBlog(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'No fields to update' });
      });

      it('should return 500 if database error occurs while updating blog', async () => {
        const req = mockRequest({
          params: { id: '1' },
          body: { title: 'Updated Title' },
        });
        const res = mockResponse();
        Blog.findByIdAndUpdate = jest
          .fn()
          .mockRejectedValue(new Error('Database error'));

        await updateBlog(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
      });
    });

    describe('deleteBlog', () => {
      it('should delete a blog successfully', async () => {
        const req = mockRequest({ params: { id: '1' } });
        const res = mockResponse();

        Blog.findByIdAndDelete = jest.fn().mockResolvedValue(true);

        await deleteBlog(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Blog deleted' });
      });

      it('should return 404 if blog not found for deletion', async () => {
        const req = mockRequest({ params: { id: '999' } });
        const res = mockResponse();
        Blog.findByIdAndDelete = jest.fn().mockResolvedValue(null);

        await deleteBlog(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Blog not found' });
      });

      it('should return 500 if database error occurs during blog deletion', async () => {
        const req = mockRequest({ params: { id: '1' } });
        const res = mockResponse();
        Blog.findByIdAndDelete = jest
          .fn()
          .mockRejectedValue(new Error('Database error'));

        await deleteBlog(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
      });
    });
  });

  describe('Blog Model', () => {
    it('should validate required fields', () => {
      const blog = new Blog({}); // empty fields

      blog.validate((err) => {
        expect(err.errors.title).toBeDefined();
        expect(err.errors.description).toBeDefined();
      });
    });
  });
});
