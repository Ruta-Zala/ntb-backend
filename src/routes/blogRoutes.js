import express from 'express';
import {
  createBlog,
  getBlogById,
  getBlogBySlug,
  updateBlog,
  addSection,
  updateBlogStatus,
  deleteImage,
  deleteBlog,
  deleteSection,
  getAllBlogs,
} from '../controllers/blogController.js';

const router = express.Router();

router.post('/', createBlog);
router.post('/:blogId/sections', addSection);
router.put('/:blogId', updateBlog);
router.put('/Status/:blogId', updateBlogStatus);
router.delete('/image', deleteImage);
router.delete('/:blogId/section/:sectionId', deleteSection);
router.delete('/:blogId', deleteBlog);
router.get('/:slug', getBlogBySlug);
router.get('/:blogId', getBlogById);
router.get('/', getAllBlogs);

export default router;
