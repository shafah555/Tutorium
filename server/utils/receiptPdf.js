const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

/**
 * Resolves a stored settings asset path (e.g. "/uploads/logo-123.png") to an
 * absolute file path on disk, returning null if it's missing/unreadable.
 */
function resolveAssetPath(uploadsPath, assetPath) {
  if (!uploadsPath || !assetPath) return null;
  const abs = path.join(uploadsPath, assetPath);
  try {
    return fs.existsSync(abs) ? abs : null;
  } catch (e) {
    return null;
  }
}

/**
 * Streams a printable PDF receipt directly to an HTTP response.
 * @param {Object} params
 * @param {import('express').Response} params.res
 * @param {Object} params.receipt - Receipt record (plain object)
 * @param {Object} params.student - Student record (plain object)
 * @param {Object} params.settings - Settings record (plain object)
 * @param {String} params.uploadsPath - absolute path to the server root (where /uploads lives)
 */
async function streamReceiptPdf({ res, receipt, student, settings, uploadsPath }) {
  const doc = new PDFDocument({ size: 'A5', margin: 40 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename=receipt-${receipt.receiptNo}.pdf`);

  doc.pipe(res);

  const currency = settings?.currency || 'BDT';
  const instituteName = settings?.instituteName || 'Tutorium';
  const logoPath = resolveAssetPath(uploadsPath, settings?.logo);
  const signaturePath = resolveAssetPath(uploadsPath, settings?.signature);

  // Header (logo, if uploaded, sits to the left of the institute name)
  const headerTop = doc.y;
  if (logoPath) {
    try {
      doc.image(logoPath, 40, headerTop, { fit: [50, 50] });
    } catch (e) {
      // Corrupt/unsupported image file; skip silently rather than failing the PDF.
    }
  }
  doc.fontSize(18).fillColor('#1D4ED8').text(instituteName, 0, headerTop + 4, { align: 'center' });
  doc.fontSize(10).fillColor('#555').text('Payment Receipt', { align: 'center' });
  doc.moveDown(0.5);
  doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor('#1D4ED8').stroke();
  doc.moveDown(1);

  doc.fillColor('#000');
  const startY = doc.y;

  doc.fontSize(10);
  doc.text(`Receipt No: ${receipt.receiptNo}`, 40, startY);
  doc.text(`Date: ${new Date(receipt.created_at || receipt.createdAt).toLocaleDateString()}`, 40, doc.y);
  doc.moveDown(0.5);

  doc.text(`Student Name: ${student.name}`);
  doc.text(`Roll Number: ${student.rollNo}`);
  doc.text(`Phone: ${student.phone}`);
  doc.moveDown(0.5);

  doc.text(`Payment Type: ${receipt.paymentType === 'tuition' ? 'Tuition Fee' : 'Model Test Fee'}`);

  if (receipt.paymentType === 'tuition' && Array.isArray(receipt.details)) {
    const monthsStr = receipt.details.map((d) => `${d.month}/${d.year}`).join(', ');
    doc.text(`Paid Month(s): ${monthsStr}`);
  } else if (receipt.paymentType === 'model_test' && receipt.details) {
    doc.text(`Model Test: ${receipt.details.title || ''}`);
  }

  doc.moveDown(0.5);
  doc.fontSize(12).fillColor('#1D4ED8').text(`Total Paid: ${currency} ${Number(receipt.amount).toFixed(2)}`);
  doc.fontSize(10).fillColor('#000');
  if (receipt.discount && Number(receipt.discount) > 0) {
    doc.text(`Discount: ${currency} ${Number(receipt.discount).toFixed(2)}`);
  }
  doc.text(`Payment Method: ${receipt.paymentMethod || 'Cash'}`);

  doc.moveDown(2);

  // Signature (uploaded signature image is drawn just above the signature line, if present)
  const sigLineY = doc.y + 30;
  if (signaturePath) {
    try {
      doc.image(signaturePath, 40, sigLineY - 32, { fit: [110, 30] });
    } catch (e) {
      // Corrupt/unsupported image file; fall back to a blank line.
    }
  }
  doc.moveTo(40, sigLineY).lineTo(160, sigLineY).stroke();
  doc.text('Teacher Signature', 40, sigLineY + 5);

  // QR code with verification data
  try {
    const qrData = JSON.stringify({
      receiptNo: receipt.receiptNo,
      student: student.rollNo,
      amount: receipt.amount,
    });
    const qrDataUrl = await QRCode.toDataURL(qrData);
    const qrImage = qrDataUrl.split(',')[1];
    doc.image(Buffer.from(qrImage, 'base64'), doc.page.width - 130, sigLineY - 40, { width: 80 });
  } catch (e) {
    // QR generation is optional; ignore failures
  }

  if (settings?.receiptFooter) {
    doc.moveDown(3);
    doc.fontSize(8).fillColor('#777').text(settings.receiptFooter, { align: 'center' });
  }

  doc.end();
}

module.exports = { streamReceiptPdf };