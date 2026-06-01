import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from '../types';

export const pdfService = {
  generateInvoice(order: Order) {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Sachin Sir Books', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Invoice for Order #' + order.id, 105, 30, { align: 'center' });
    
    // Customer Info
    doc.setFontSize(12);
    doc.text('Customer Details:', 20, 50);
    doc.setFontSize(10);
    doc.text(`Name: ${order.address.fullName}`, 20, 55);
    doc.text(`Phone: ${order.address.phone}`, 20, 60);
    doc.text(`Address: ${order.address.addressLine}, ${order.address.city}`, 20, 65);
    doc.text(`${order.address.state}, ${order.address.pincode}`, 20, 70);
    
    // Items Table
    const tableData = order.items.map(item => [
      item.title,
      item.quantity,
      `₹${item.finalPrice}`,
      `₹${item.finalPrice * item.quantity}`
    ]);
    
    autoTable(doc, {
      startY: 80,
      head: [['Item', 'Qty', 'Price', 'Total']],
      body: tableData,
    });
    
    // Summary
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Total Amount: ₹${order.total}`, 140, finalY);
    
    // Download
    doc.save(`invoice-${order.id}.pdf`);
  }
};
