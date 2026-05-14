const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('../config/s3');

const BUCKET = process.env.AWS_BUCKET_NAME;
const SUPABASE_URL = process.env.SUPABASE_S3_ENDPOINT
  .replace('/storage/v1/s3', '')
  .replace('https://', '');

exports.uploadToS3 = async (key, buffer, contentType) => {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType
  }));
  return key;
};

// Return direct public URL instead of signed URL
exports.getSignedUrl = async (key, expiresInSeconds = 3600) => {
  return `https://${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key}`;
};

exports.deleteFromS3 = async (key) => {
  const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
};

exports.keys = {
  pdf:   (bookId) => `books/${bookId}/original.pdf`,
  cover: (bookId) => `books/${bookId}/cover.jpg`,
  page:  (bookId, pageNum) => `books/${bookId}/pages/page-${String(pageNum).padStart(4, '0')}.jpg`
};