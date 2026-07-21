const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

/**
 * Streams a printable PDF receipt directly to an HTTP response.
 * @param {Object} params
 * @param {import('express').Response} params.res
 * @param {Object} params.receipt - Receipt record (plain object)
 * @param {Object} params.student - Student record (plain object)
 * @param {Object} params.settings - Settings record (plain object)
 */
async function streamReceiptPdf({ res, receipt, student, settings }) {
  const doc = new PDFDocument({ size: 'A5', margin: 40 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename=receipt-${receipt.receiptNo}.pdf`);

  doc.pipe(res);

  const currency = settings?.currency || 'BDT';
  const instituteName = settings?.instituteName || 'Tutorium';

  // Header
  doc.fontSize(18).fillColor('#1D4ED8').text(instituteName, { align: 'center' });
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

  // Signature line
  const sigY = doc.y + 30;
  doc.moveTo(40, sigY).lineTo(160, sigY).stroke();
  doc.text('Teacher Signature', 40, sigY + 5);

  // QR code with verification data
  try {
    const qrData = JSON.stringify({
      receiptNo: receipt.receiptNo,
      student: student.rollNo,
      amount: receipt.amount,
    });
    const qrDataUrl = await QRCode.toDataURL(qrData);
    const qrImage = qrDataUrl.split(',')[1];
    doc.image(Buffer.from(qrImage, 'base64'), doc.page.width - 130, sigY - 40, { width: 80 });
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
