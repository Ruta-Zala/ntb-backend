import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3Client from '../config/s3Setup.js';

import dotenv from 'dotenv';

dotenv.config();

/**
 * Generate Presigned URL for image uploads
 */
export const getPresignedUrl = async (req, res) => {
  try {
    const { type, blogId, sectionId, blockId, keyname, extension } = req.query;

    if (!type) {
      return res.status(400).json({
        message: 'Type is required (e.g., thumbnail, blogImage, websiteLogo).',
      });
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

      case 'websiteLogo':
        if (!keyname) {
          return res.status(400).json({
            message: 'keyname is required for website logos.',
          });
        }
        if (
          !extension ||
          !['jpg', 'jpeg', 'png', 'ico'].includes(extension.toLowerCase())
        ) {
          return res.status(400).json({
            message:
              'Invalid or missing file extension. Supported extensions: jpg, jpeg, png, ico.',
          });
        }
        key = `media/website_settings/${keyname}/image.${extension}`;
        break;

      default:
        return res.status(400).json({
          message:
            'Invalid type. Supported types are: thumbnail, blogImage, websiteLogo.',
        });
    }

    // Generate presigned URL
    const presignedUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        ContentType: `image/${extension}`,
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
