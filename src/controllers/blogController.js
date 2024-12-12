import Blog from '../models/blogModel.js';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';
import dotenv from 'dotenv';
import sharp from 'sharp';
import fetch from 'node-fetch';
dotenv.config();

// Initialize the S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
/**
 * Generate Presigned URL for image uploads
 */
export const getPresignedUrl = async (req, res) => {
  try {
    const { type, blogId, sectionId, blockId } = req.query;
    if (!type) {
      return res
        .status(400)
        .json({ message: 'Type is required (e.g., thumbnail, blogImage).' });
    }

    let key = '';

    switch (type) {
      case 'thumbnail':
        if (blogId) {
          key = `media/blogs/${blogId}/thumbnail.jpg`;
        } else {
          key = `temp/thumbnail-${Date.now()}.jpg`;
        }
        break;
      case 'blogImage':
        if (!blogId || !sectionId || !blockId) {
          return res.status(400).json({
            message:
              'blogId, sectionId, and blockId are required for blog images.',
          });
        }
        key = `media/blogs/${blogId}/${sectionId}/${blockId}.jpg`;
        break;
      default:
        return res.status(400).json({
          message: 'Invalid type. Supported types are: thumbnail, blogImage.',
        });
    }

    const presignedUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      }),
      { expiresIn: 60 * 5 },
    );

    res.status(200).json({
      presignedUrl,
      fileUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ message: 'Failed to generate presigned URL.' });
  }
};

/**
 * Create Blog Metadata
 */
export const createBlog = async (req, res) => {
  try {
    const { title, short_description, author, tags, thumbnail } = req.body;

    if (!title || !short_description || !author || !tags || !thumbnail) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Check for an existing blog with the same title
    const existingBlog = await Blog.findOne({ title });
    if (existingBlog) {
      return res.status(400).json({
        message:
          'A blog with this title already exists. Please choose a unique title.',
      });
    }

    const blogId = uuidv4();
    const slug = slugify(title, { lower: true, strict: true });

    const tempKey = new URL(thumbnail).pathname.substring(1); // Extract S3 key
    const response = await fetch(thumbnail);
    if (!response.ok) {
      return res.status(400).json({ message: 'Failed to fetch the image.' });
    }

    const buffer = await response.buffer();

    const compressedImageBuffer = await sharp(buffer)
      .resize(800)
      .jpeg({ quality: 80 })
      .toBuffer();

    const finalKey = `media/blogs/${blogId}/thumbnail.jpg`;

    // Upload the compressed image to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: finalKey,
        Body: compressedImageBuffer,
        ContentType: 'image/jpeg',
      }),
    );

    // Remove the temp file from S3
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: tempKey,
      }),
    );

    const newBlog = new Blog({
      blogId,
      title,
      short_description,
      author,
      tags,
      thumbnail: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${finalKey}`,
      slug,
    });

    const savedBlog = await newBlog.save();

    res.status(201).json({
      message: 'Blog created successfully.',
      blog: savedBlog,
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ message: 'Failed to create blog.' });
  }
};

/**
 * Add Sections with Blocks
 */
export const addSection = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { order, blocks, sectionId, type } = req.body;

    if (!order || !blocks || blocks.length === 0) {
      return res
        .status(400)
        .json({ message: 'Order and at least one block are required.' });
    }

    const sectionIdStr = String(sectionId);
    const blog = await Blog.findOne({ blogId: blogId });
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found.' });
    }

    let section = blog.sections.find((sec) => sec._id === sectionIdStr);

    if (section) {
      section.order = order;
      section.type = type;
      section.blocks = blocks.map((block) => {
        if (block.type === 'media' && block.image) {
          return {
            _id: block._id,
            order: block.order,
            image: block.image,
            type: block.type,
          };
        } else if (block.type === 'text') {
          return {
            _id: block._id,
            order: block.order,
            content: block.content,
            type: block.type,
          };
        }
        return block;
      });
    } else {
      section = {
        _id: sectionIdStr,
        type,
        order,
        blocks: blocks.map((block) => {
          if (block.type === 'media' && block.image) {
            return {
              _id: block._id,
              order: block.order,
              image: block.image,
              type: block.type,
            };
          } else if (block.type === 'text') {
            return {
              _id: block._id,
              order: block.order,
              content: block.content,
              type: block.type,
            };
          }
          return block;
        }),
      };
      blog.sections.push(section);
    }

    const mediaPromises = blocks.map(async (block) => {
      if (block.type === 'media' && block.image) {
        try {
          const imageUrl = block.image;
          const imagePath = imageUrl.split('.amazonaws.com/')[1];

          const response = await fetch(imageUrl);
          if (!response.ok) {
            throw new Error('Failed to fetch the image.');
          }

          const buffer = await response.buffer();

          const compressedImageBuffer = await sharp(buffer)
            .resize(800)
            .jpeg({ quality: 80 })
            .toBuffer();

          await s3Client.send(
            new PutObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: imagePath,
              Body: compressedImageBuffer,
              ContentType: 'image/jpeg',
            }),
          );
        } catch (error) {
          console.error('Error processing image:', error);
          throw new Error('Image processing failed.');
        }
      }
    });

    await Promise.all(mediaPromises);

    await blog.save();

    res.status(200).json({
      message: 'Section added/updated successfully.',
      blog,
    });
  } catch (error) {
    console.error('Error adding/updating section:', error);
    res.status(500).json({ message: 'Failed to add/update section.' });
  }
};

/**
 * Updates Blog
 */
export const updateBlog = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { title, short_description, author, tags, thumbnail, sections } =
      req.body;

    if (title) {
      return res.status(400).json({ message: 'Title cannot be updated.' });
    }

    const blog = await Blog.findOne({ blogId: blogId });
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found.' });
    }

    let updatedThumbnailUrl = blog.thumbnail;
    if (thumbnail && thumbnail !== blog.thumbnail) {
      const response = await fetch(thumbnail);
      if (!response.ok) {
        return res
          .status(400)
          .json({ message: 'Failed to fetch the new thumbnail.' });
      }

      const buffer = await response.buffer();
      const compressedImageBuffer = await sharp(buffer)
        .resize(800)
        .jpeg({ quality: 80 })
        .toBuffer();

      const finalKey = new URL(thumbnail).pathname.substring(1);

      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: finalKey,
          Body: compressedImageBuffer,
          ContentType: 'image/jpeg',
        }),
      );

      if (blog.thumbnail) {
        const oldKey = new URL(blog.thumbnail).pathname.substring(1);
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: oldKey,
          }),
        );
      }
      updatedThumbnailUrl = thumbnail;
    }
    const updatedSections = sections
      ? await Promise.all(
          sections.map(async (updatedSection) => {
            const existingSection = blog.sections.find(
              (section) => section.order === updatedSection.order,
            );

            if (!existingSection) {
              return updatedSection;
            }

            const updatedBlocks = await Promise.all(
              updatedSection.blocks.map(async (updatedBlock) => {
                const existingBlock = existingSection.blocks.find(
                  (block) => block.order === updatedBlock.order,
                );

                if (!existingBlock) {
                  if (updatedBlock.image) {
                    const response = await fetch(updatedBlock.image);
                    if (!response.ok) {
                      throw new Error('Failed to fetch block image.');
                    }

                    const buffer = await response.buffer();
                    const compressedImageBuffer = await sharp(buffer)
                      .resize(800)
                      .jpeg({ quality: 80 })
                      .toBuffer();

                    const finalKey = new URL(
                      updatedBlock.image,
                    ).pathname.substring(1); // Original S3 path

                    await s3Client.send(
                      new PutObjectCommand({
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: finalKey,
                        Body: compressedImageBuffer,
                        ContentType: 'image/jpeg',
                      }),
                    );
                  }
                  return updatedBlock;
                }

                if (
                  updatedBlock.image &&
                  updatedBlock.image !== existingBlock.image
                ) {
                  const response = await fetch(updatedBlock.image);
                  if (!response.ok) {
                    throw new Error('Failed to fetch updated block image.');
                  }

                  const buffer = await response.buffer();
                  const compressedImageBuffer = await sharp(buffer)
                    .resize(800)
                    .jpeg({ quality: 80 })
                    .toBuffer();

                  const finalKey = new URL(
                    updatedBlock.image,
                  ).pathname.substring(1); // Original S3 path

                  await s3Client.send(
                    new PutObjectCommand({
                      Bucket: process.env.AWS_BUCKET_NAME,
                      Key: finalKey,
                      Body: compressedImageBuffer,
                      ContentType: 'image/jpeg',
                    }),
                  );

                  if (existingBlock.image) {
                    const oldKey = new URL(
                      existingBlock.image,
                    ).pathname.substring(1);
                    await s3Client.send(
                      new DeleteObjectCommand({
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: oldKey,
                      }),
                    );
                  }
                }

                return { ...existingBlock, ...updatedBlock };
              }),
            );

            return {
              ...existingSection,
              ...updatedSection,
              blocks: updatedBlocks,
            };
          }),
        )
      : blog.sections;

    // Update fields only if they are present in the payload
    if (short_description) blog.short_description = short_description;
    if (author) blog.author = author;
    if (tags) blog.tags = tags;
    if (thumbnail) blog.thumbnail = updatedThumbnailUrl;
    if (sections) blog.sections = updatedSections;

    // Save the updated blog
    const updatedBlog = await blog.save();

    res.status(200).json({
      message: 'Blog updated successfully.',
      blog: updatedBlog,
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ message: 'Failed to update blog.' });
  }
};

/**
 * Update Blog Status (Draft/Published)
 */
export const updateBlogStatus = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { status } = req.body;

    if (!['draft', 'published'].includes(status)) {
      return res
        .status(400)
        .json({ message: 'Invalid status. Must be "draft" or "published".' });
    }

    const blog = await Blog.findOneAndUpdate(
      { blogId: blogId },
      { status, updatedDate: Date.now() },
      { new: true },
    );

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found.' });
    }

    res.status(200).json({
      message: `Blog status updated to ${status}.`,
      blog,
    });
  } catch (error) {
    console.error('Error updating blog status:', error);
    res.status(500).json({ message: 'Failed to update blog status.' });
  }
};

/**
 * Delete Blog Section and Associated Blocks
 */
export const deleteSection = async (req, res) => {
  try {
    const { blogId, sectionId } = req.params;

    const blog = await Blog.findOne({ blogId: blogId });
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found.' });
    }

    const sectionIndex = blog.sections.findIndex(
      (sec) => sec._id === sectionId,
    );

    if (sectionIndex === -1) {
      return res.status(404).json({ message: 'Section not found.' });
    }

    const sectionToDelete = blog.sections[sectionIndex];

    for (const block of sectionToDelete.blocks) {
      if (block.type === 'media' && block.image) {
        const imagePath = block.image.split('.amazonaws.com/')[1];

        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: imagePath,
          }),
        );
        console.log(`Deleted image from S3: ${imagePath}`);
      }
    }

    blog.sections.splice(sectionIndex, 1);

    await blog.save();

    res.status(200).json({
      message: 'Section and associated images deleted successfully.',
      blog,
    });
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({ message: 'Failed to delete section and images.' });
  }
};

/**
 * Delete Blog and Associated Images
 */
export const deleteBlog = async (req, res) => {
  try {
    const { blogId } = req.params;

    const blog = await Blog.findOne({ blogId: blogId });
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found.' });
    }

    const deletePromises = [];

    if (blog.thumbnail) {
      const thumbnailKey = blog.thumbnail.split('.com/')[1];
      deletePromises.push(
        s3Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: thumbnailKey,
          }),
        ),
      );
    }

    const imageKeys = [];

    blog.sections.forEach((section) => {
      section.blocks.forEach((block) => {
        if (block.image) {
          const blockImageKey = block.image.split('.com/')[1];
          imageKeys.push({ Key: blockImageKey });
        }
      });
    });

    if (imageKeys.length > 0) {
      const deleteObjectsParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Delete: {
          Objects: imageKeys,
        },
      };
      deletePromises.push(
        s3Client.send(new DeleteObjectsCommand(deleteObjectsParams)),
      );
    }

    const folderKeyPrefix = `${blogId}/`;

    const listParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Prefix: folderKeyPrefix,
    };

    const listObjectsResponse = await s3Client.send(
      new ListObjectsCommand(listParams),
    );

    if (
      listObjectsResponse.Contents &&
      listObjectsResponse.Contents.length > 0
    ) {
      const deleteObjectsParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Delete: {
          Objects: listObjectsResponse.Contents.map((obj) => ({
            Key: obj.Key,
          })),
        },
      };
      deletePromises.push(
        s3Client.send(new DeleteObjectsCommand(deleteObjectsParams)),
      );
    }

    await Promise.all(deletePromises);

    await Blog.deleteOne({ blogId: blogId });

    res
      .status(200)
      .json({ message: 'Blog and associated images deleted successfully.' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ message: 'Failed to delete blog.' });
  }
};

/**
 * delet images from the s3
 */
export const deleteImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required.' });
    }

    const key = new URL(imageUrl).pathname.substring(1);

    try {
      await s3Client.send(
        new HeadObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key,
        }),
      );
    } catch (err) {
      if (err.$fault === 'client' && err.$metadata.httpStatusCode === 404) {
        return res
          .status(404)
          .json({ message: 'File not found in the S3 bucket.' });
      }

      console.error('Error checking file existence:', err);
      throw err;
    }

    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key,
        }),
      );
      return res.status(200).json({
        message: 'Image deleted successfully.',
        imageUrl,
      });
    } catch (deleteErr) {
      console.error('Error deleting image:', deleteErr);
      return res.status(500).json({ message: 'Failed to delete image.' });
    }
  } catch (error) {
    console.error('Error in deleteImage:', error);

    res.status(500).json({ message: 'Failed to delete image.' });
  }
};

/**
 * Get Blog Details by ID
 */
export const getBlogById = async (req, res) => {
  try {
    const { blogId } = req.params;

    const blog = await Blog.findOne({ blogId: blogId });
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found.' });
    }

    res.status(200).json(blog);
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({ message: 'Failed to fetch blog.' });
  }
};

/**
 * Get Blog Details by Slug
 */
export const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const blog = await Blog.findOne({ slug: slug });
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found.' });
    }

    res.status(200).json(blog);
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({ message: 'Failed to fetch blog.' });
  }
};

/**
 * Get All Blogs with Pagination
 */
export const getAllBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;

    const blogs = await Blog.find()
      .sort({ createdDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json(blogs);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ message: 'Failed to fetch blogs.' });
  }
};
