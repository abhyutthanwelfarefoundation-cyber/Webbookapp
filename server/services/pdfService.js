const { fromBuffer } = require('pdf2pic');
const sharp = require('sharp');
const { uploadToS3, keys } = require('./s3Service');

// Convert PDF buffer → page images → upload all to S3
// Returns total page count
exports.processPdf = async (pdfBuffer, bookId) => {
  const converter = fromBuffer(pdfBuffer, {
    density: 150,       // DPI — 150 is sharp on tablet, not too heavy
    format: 'jpeg',
    width: 1200,
    height: 1700,
    quality: 85
  });

  // Get page count first
  const info = await converter.bulk(-1, { responseType: 'buffer' });
  const totalPages = info.length;

  const pageKeys = [];

  for (let i = 0; i < info.length; i++) {
    const pageNum = i + 1;
    const key = keys.page(bookId, pageNum);

    // Compress with sharp before uploading
    const compressed = await sharp(info[i].buffer)
      .jpeg({ quality: 80, progressive: true })
      .toBuffer();

    await uploadToS3(key, compressed, 'image/jpeg');
    pageKeys.push(key);
  }

  return { totalPages, pageKeys };
};

// Generate cover image from first page of PDF
exports.generateCover = async (pdfBuffer, bookId) => {
  const converter = fromBuffer(pdfBuffer, {
    density: 150,
    format: 'jpeg',
    width: 800,
    height: 1130
  });

  const [firstPage] = await converter.bulk(1, { responseType: 'buffer' });

  const coverBuffer = await sharp(firstPage.buffer)
    .jpeg({ quality: 85 })
    .toBuffer();

  const key = keys.cover(bookId);
  await uploadToS3(key, coverBuffer, 'image/jpeg');
  return key;
};
