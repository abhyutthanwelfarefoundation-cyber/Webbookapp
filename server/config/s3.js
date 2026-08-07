const { S3Client } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.SUPABASE_ACCESS_KEY,
    secretAccessKey: process.env.SUPABASE_SECRET_KEY
  },
  endpoint: process.env.SUPABASE_S3_ENDPOINT,
  forcePathStyle: true,
  signingRegion: 'ap-northeast-2'
});

module.exports = s3;