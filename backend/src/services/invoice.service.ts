import PDFDocument from 'pdfkit';
import type { IBooking } from '../models/Booking.model';
import type { IPayment } from '../models/Payment.model';

interface InvoiceData {
  invoiceNumber: string;
  booking: IBooking;
  payment: IPayment;
  customerName: string;
  customerEmail: string;
  vehicleTitle: string;
}

/**
 * Renders a simple, legible invoice PDF into a Buffer. Kept dependency-free
 * beyond PDFKit itself so it works the same whether uploads are going to
 * Cloudinary or the local disk fallback.
 */
export function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const { invoiceNumber, booking, payment, customerName, customerEmail, vehicleTitle } = data;

    doc.fontSize(20).font('Helvetica-Bold').text('DriveHub', { continued: false });
    doc.fontSize(10).font('Helvetica').fillColor('#5b6472').text('Smart Vehicle Rental & Fleet Management');
    doc.moveDown(1.5);

    doc.fillColor('#0b0f14').fontSize(16).font('Helvetica-Bold').text('Invoice');
    doc.fontSize(10).font('Helvetica').fillColor('#5b6472');
    doc.text(`Invoice number: ${invoiceNumber}`);
    doc.text(`Booking reference: ${booking.bookingCode}`);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`);
    doc.moveDown(1);

    doc.fillColor('#0b0f14').fontSize(11).font('Helvetica-Bold').text('Billed to');
    doc.fontSize(10).font('Helvetica').fillColor('#5b6472').text(customerName).text(customerEmail);
    doc.moveDown(1);

    doc.fillColor('#0b0f14').fontSize(11).font('Helvetica-Bold').text('Trip');
    doc.fontSize(10).font('Helvetica').fillColor('#5b6472');
    doc.text(`Vehicle: ${vehicleTitle}`);
    doc.text(
      `${new Date(booking.startDate).toLocaleDateString('en-IN')} to ${new Date(booking.endDate).toLocaleDateString(
        'en-IN'
      )}`
    );
    doc.moveDown(1.5);

    const rows: [string, number][] = [
      ['Base fare', booking.pricing.baseAmount],
      ...(booking.pricing.discountAmount > 0
        ? ([['Discount' + (booking.pricing.couponCode ? ` (${booking.pricing.couponCode})` : ''), -booking.pricing.discountAmount]] as [string, number][])
        : []),
      ['Taxes (GST)', booking.pricing.taxAmount],
      ['Security deposit (refundable)', booking.pricing.securityDeposit],
    ];

    const tableTop = doc.y;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#0b0f14');
    doc.text('Description', 50, tableTop);
    doc.text('Amount', 450, tableTop, { width: 100, align: 'right' });
    doc.moveTo(50, tableTop + 16).lineTo(550, tableTop + 16).strokeColor('#e7e3d8').stroke();

    let y = tableTop + 24;
    doc.font('Helvetica').fillColor('#5b6472');
    rows.forEach(([label, amount]) => {
      doc.text(label, 50, y);
      doc.text(`${amount < 0 ? '-' : ''}Rs. ${Math.abs(amount).toLocaleString('en-IN')}`, 450, y, {
        width: 100,
        align: 'right',
      });
      y += 20;
    });

    doc.moveTo(50, y + 4).lineTo(550, y + 4).strokeColor('#0b0f14').stroke();
    doc.font('Helvetica-Bold').fillColor('#0b0f14');
    doc.text('Total paid', 50, y + 12);
    doc.text(`Rs. ${payment.amount.toLocaleString('en-IN')}`, 450, y + 12, { width: 100, align: 'right' });

    doc.moveDown(4);
    doc.fontSize(8).font('Helvetica').fillColor('#9aa5b3').text(
      'This is a system-generated invoice from DriveHub and does not require a signature.',
      { align: 'center' }
    );

    doc.end();
  });
}
