exports.generateAdvancePaymentReceipt = (payment, settings) => {
  const formattedDate = new Date(payment.payment_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Advance Payment Receipt - ${payment.receipt_number}</title>
      <style>
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }
        }
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
          color: #333;
          line-height: 1.6;
        }
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 100px;
          opacity: 0.05;
          z-index: -1;
          color: #000;
          white-space: nowrap;
        }
        .company-header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 2px solid #333;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          margin: 0;
          color: #1976d2;
        }
        .company-details {
          font-size: 14px;
          color: #666;
          margin: 5px 0;
        }
        .document-title {
          font-size: 20px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
          color: #333;
          text-transform: uppercase;
        }
        .slip-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          padding: 15px;
          background-color: #f5f5f5;
          border-radius: 5px;
        }
        .contractor-info, .payment-info {
          flex: 1;
        }
        .info-label {
          font-weight: bold;
          color: #666;
          font-size: 12px;
          text-transform: uppercase;
        }
        .info-value {
          font-size: 14px;
          margin-bottom: 10px;
        }
        .payment-details {
          margin: 20px 0;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 20px;
          border-bottom: 1px solid #eee;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: bold;
          color: #333;
        }
        .amount {
          font-family: monospace;
          font-size: 14px;
        }
        .total-section {
          margin-top: 20px;
          padding: 15px 20px;
          background-color: #1976d2;
          color: white;
          border-radius: 5px;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
        .company-registration {
          font-size: 12px;
          color: #666;
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="watermark">PAYMENT SLIP</div>
      <div class="company-header">
        <h1 class="company-name">${settings?.company_name || 'COMPANY NAME'}</h1>
        <p class="company-details">${settings?.company_address || ''}</p>
        <p class="company-details">Phone: ${settings?.company_phone || ''}</p>
        <p class="company-registration">VAT No: ${settings?.vat_number || ''} | Tax No: ${settings?.tax_number || ''}</p>
      </div>

      <div class="document-title">Advance Payment Receipt</div>

      <div class="slip-header">
        <div class="contractor-info">
          <div class="info-label">Contractor Name</div>
          <div class="info-value">${payment.contractor_name}</div>
          <div class="info-label">Contractor ID</div>
          <div class="info-value">${payment.contractor_id}</div>
        </div>
        <div class="payment-info">
          <div class="info-label">Receipt Number</div>
          <div class="info-value">${payment.receipt_number}</div>
          <div class="info-label">Payment Date</div>
          <div class="info-value">${formattedDate}</div>
        </div>
      </div>

      <div class="payment-details">
        <div class="detail-row">
          <span class="detail-label">Payment Method</span>
          <span class="amount">Cash</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Payment Type</span>
          <span class="amount">Advance Payment</span>
        </div>
      </div>

      <div class="total-section detail-row">
        <span class="detail-label">Total Amount</span>
        <span class="amount">Rs. ${Number(payment.amount).toLocaleString()}</span>
      </div>

      ${payment.notes ? `
      <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
        <div class="info-label">Notes</div>
        <div style="font-size: 14px; margin-top: 5px;">${payment.notes}</div>
      </div>
      ` : ''}

      <div class="footer">
        <p>Generated on ${new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })} IST</p>
        <p>For any queries, please contact ${settings?.company_name || ''} at ${settings?.company_phone || ''}</p>
      </div>
    </body>
    </html>
  `;
};

exports.generateCuttingPaymentReceipt = (payment, settings) => {
  const formattedDate = new Date(payment.payment_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Cutting Payment Receipt - ${payment.receipt_number}</title>
      <style>
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }
        }
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
          color: #333;
          line-height: 1.6;
        }
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 100px;
          opacity: 0.05;
          z-index: -1;
          color: #000;
          white-space: nowrap;
        }
        .company-header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 2px solid #333;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          margin: 0;
          color: #1976d2;
        }
        .company-details {
          font-size: 14px;
          color: #666;
          margin: 5px 0;
        }
        .document-title {
          font-size: 20px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
          color: #333;
          text-transform: uppercase;
        }
        .slip-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          padding: 15px;
          background-color: #f5f5f5;
          border-radius: 5px;
        }
        .contractor-info, .payment-period {
          flex: 1;
        }
        .info-label {
          font-weight: bold;
          color: #666;
          font-size: 12px;
          text-transform: uppercase;
        }
        .info-value {
          font-size: 14px;
          margin-bottom: 10px;
        }
        .payment-details {
          margin: 20px 0;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 20px;
          border-bottom: 1px solid #eee;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: bold;
          color: #333;
        }
        .amount {
          font-family: monospace;
          font-size: 14px;
        }
        .total-section {
          margin-top: 20px;
          padding: 15px 20px;
          background-color: #1976d2;
          color: white;
          border-radius: 5px;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
        .company-registration {
          font-size: 12px;
          color: #666;
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="watermark">PAYMENT SLIP</div>
      <div class="company-header">
        <h1 class="company-name">${settings?.company_name || 'COMPANY NAME'}</h1>
        <p class="company-details">${settings?.company_address || ''}</p>
        <p class="company-details">Phone: ${settings?.company_phone || ''}</p>
        <p class="company-registration">VAT No: ${settings?.vat_number || ''} | Tax No: ${settings?.tax_number || ''}</p>
      </div>

      <div class="document-title">Cutting Payment Slip</div>

      <div class="slip-header">
        <div class="contractor-info">
          <div class="info-label">Contractor Name</div>
          <div class="info-value">${payment.contractor_name}</div>
          <div class="info-label">Receipt Number</div>
          <div class="info-value">${payment.receipt_number}</div>
        </div>
        <div class="payment-period">
          <div class="info-label">Land Number</div>
          <div class="info-value">${payment.land_number || 'N/A'}</div>
          <div class="info-label">Payment Date</div>
          <div class="info-value">${formattedDate}</div>
        </div>
      </div>

      <div class="payment-details">
        <div class="detail-row">
          <span class="detail-label">Location</span>
          <span class="amount">${payment.location || 'N/A'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Company Contribution</span>
          <span class="amount">Rs. ${Number(payment.company_contribution).toLocaleString()}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Manufacturing Contribution</span>
          <span class="amount">Rs. ${Number(payment.manufacturing_contribution).toLocaleString()}</span>
        </div>
      </div>

      <div class="total-section detail-row">
        <span class="detail-label">Total Amount</span>
        <span class="amount">Rs. ${Number(payment.total_amount).toLocaleString()}</span>
      </div>

      ${payment.notes ? `
      <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
        <div class="info-label">Notes</div>
        <div style="font-size: 14px; margin-top: 5px;">${payment.notes}</div>
      </div>
      ` : ''}

      <div class="footer">
        <p>Generated on ${new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })} IST</p>
        <p>For any queries, please contact ${settings?.company_name || ''} at ${settings?.company_phone || ''}</p>
      </div>
    </body>
    </html>
  `;
};

exports.generateManufacturingReceipt = (order, settings) => {
  const formattedDate = new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Manufacturing Order Receipt - ${order.order_number}</title>
      <style>
        @media print {
          @page {
            margin: 0;
            size: A4;
          }
          body {
            margin: 1.6cm;
          }
        }

        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }

        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #eee;
        }

        .company-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
          color: #2c3e50;
        }

        .receipt-title {
          font-size: 20px;
          color: #7f8c8d;
          margin-bottom: 5px;
        }

        .receipt-number {
          font-size: 16px;
          color: #95a5a6;
        }

        .receipt-box {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 30px;
          background-color: #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .section {
          margin-bottom: 25px;
        }

        .section-title {
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 10px;
          font-size: 14px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .label {
          color: #7f8c8d;
          flex: 1;
        }

        .value {
          color: #2c3e50;
          flex: 2;
          text-align: right;
        }

        .amount-section {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 4px;
          margin: 20px 0;
        }

        .amount-row {
          display: flex;
          justify-content: space-between;
          font-size: 18px;
          font-weight: bold;
          color: #2c3e50;
        }

        .footer {
          margin-top: 30px;
          text-align: center;
          color: #7f8c8d;
          font-size: 12px;
        }

        .materials-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }

        .materials-table th,
        .materials-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        .materials-table th {
          background-color: #f8f9fa;
          font-weight: bold;
          color: #2c3e50;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="company-name">${settings?.company_name || 'COMPANY NAME'}</div>
          <div class="receipt-title">Manufacturing Order Receipt</div>
          <div class="receipt-number">${order.order_number}</div>
          ${settings?.company_address ? `
          <div style="color: #7f8c8d; font-size: 14px; margin-top: 10px;">
            ${settings.company_address}
          </div>
          ` : ''}
          ${settings?.company_phone ? `
          <div style="color: #7f8c8d; font-size: 14px;">
            Tel: ${settings.company_phone}
          </div>
          ` : ''}
        </div>

        <div class="receipt-box">
          <div class="section">
            <div class="section-title">ORDER DETAILS</div>
            <div class="detail-row">
              <span class="label">Date:</span>
              <span class="value">${formattedDate}</span>
            </div>
            <div class="detail-row">
              <span class="label">Status:</span>
              <span class="value">${order.status.toUpperCase()}</span>
            </div>
            <div class="detail-row">
              <span class="label">Product:</span>
              <span class="value">${order.product_name}</span>
            </div>
            <div class="detail-row">
              <span class="label">Quantity:</span>
              <span class="value">${order.quantity} ${order.unit || 'units'}</span>
            </div>
          </div>

          ${order.materials && order.materials.length > 0 ? `
          <div class="section">
            <div class="section-title">MATERIALS USED</div>
            <table class="materials-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Quantity Used</th>
                  <th>Unit Cost</th>
                  <th>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                ${order.materials.map(material => `
                <tr>
                  <td>${material.name}</td>
                  <td>${material.quantity_used} ${material.unit}</td>
                  <td>Rs. ${Number(material.unit_cost).toLocaleString()}</td>
                  <td>Rs. ${Number(material.quantity_used * material.unit_cost).toLocaleString()}</td>
                </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="amount-section">
            <div class="amount-row">
              <span>Total Cost:</span>
              <span>Rs. ${Number(order.total_cost || 0).toLocaleString()}</span>
            </div>
          </div>

          ${order.notes ? `
          <div class="section">
            <div class="section-title">NOTES</div>
            <div style="color: #2c3e50; font-size: 14px;">${order.notes}</div>
          </div>
          ` : ''}
        </div>

        <div class="footer">
          <p>This is a computer generated receipt.</p>
          <p>For any queries, please contact: ${settings?.company_phone || 'support@company.com'}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

exports.generateManufacturingInvoice = (invoice, settings) => {
  const formattedDate = new Date(invoice.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Manufacturing Invoice - ${invoice.invoice_number}</title>
      <style>
        @media print {
          @page {
            margin: 0;
            size: A4;
          }
          body {
            margin: 1.6cm;
          }
        }

        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }

        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #eee;
        }

        .company-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
          color: #2c3e50;
        }

        .invoice-title {
          font-size: 20px;
          color: #7f8c8d;
          margin-bottom: 5px;
        }

        .invoice-number {
          font-size: 16px;
          color: #95a5a6;
        }

        .invoice-box {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 30px;
          background-color: #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .section {
          margin-bottom: 25px;
        }

        .section-title {
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 10px;
          font-size: 14px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .label {
          color: #7f8c8d;
          flex: 1;
        }

        .value {
          color: #2c3e50;
          flex: 2;
          text-align: right;
        }

        .amount-section {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 4px;
          margin: 20px 0;
        }

        .amount-row {
          display: flex;
          justify-content: space-between;
          font-size: 18px;
          font-weight: bold;
          color: #2c3e50;
        }

        .footer {
          margin-top: 30px;
          text-align: center;
          color: #7f8c8d;
          font-size: 12px;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }

        .items-table th,
        .items-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        .items-table th {
          background-color: #f8f9fa;
          font-weight: bold;
          color: #2c3e50;
        }

        .payment-status {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .payment-status.paid {
          background-color: #4caf50;
          color: white;
        }

        .payment-status.pending {
          background-color: #ff9800;
          color: white;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="company-name">${settings?.company_name || 'COMPANY NAME'}</div>
          <div class="invoice-title">Manufacturing Invoice</div>
          <div class="invoice-number">${invoice.invoice_number}</div>
          ${settings?.company_address ? `
          <div style="color: #7f8c8d; font-size: 14px; margin-top: 10px;">
            ${settings.company_address}
          </div>
          ` : ''}
          ${settings?.company_phone ? `
          <div style="color: #7f8c8d; font-size: 14px;">
            Tel: ${settings.company_phone}
          </div>
          ` : ''}
        </div>

        <div class="invoice-box">
          <div class="section">
            <div class="section-title">INVOICE DETAILS</div>
            <div class="detail-row">
              <span class="label">Date:</span>
              <span class="value">${formattedDate}</span>
            </div>
            <div class="detail-row">
              <span class="label">Payment Status:</span>
              <span class="value">
                <span class="payment-status ${invoice.payment_status === 'paid' ? 'paid' : 'pending'}">
                  ${invoice.payment_status || 'Pending'}
                </span>
              </span>
            </div>
          </div>

          ${invoice.contractor_name ? `
          <div class="section">
            <div class="section-title">CONTRACTOR DETAILS</div>
            <div class="detail-row">
              <span class="label">Name:</span>
              <span class="value">${invoice.contractor_name}</span>
            </div>
            <div class="detail-row">
              <span class="label">Contractor ID:</span>
              <span class="value">${invoice.contractor_id}</span>
            </div>
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">PRODUCT DETAILS</div>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${invoice.product_name}</td>
                  <td>${invoice.quantity} ${invoice.unit || 'units'}</td>
                  <td>Rs. ${Number(invoice.unit_price || 0).toLocaleString()}</td>
                  <td>Rs. ${Number(invoice.total_amount || 0).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="amount-section">
            <div class="detail-row">
              <span class="label">Subtotal:</span>
              <span class="value">Rs. ${Number(invoice.subtotal || 0).toLocaleString()}</span>
            </div>
            ${invoice.tax_amount ? `
            <div class="detail-row">
              <span class="label">Tax (${invoice.tax_rate || 0}%):</span>
              <span class="value">Rs. ${Number(invoice.tax_amount).toLocaleString()}</span>
            </div>
            ` : ''}
            <div class="amount-row">
              <span>Total Amount:</span>
              <span>Rs. ${Number(invoice.total_amount || 0).toLocaleString()}</span>
            </div>
          </div>

          ${invoice.notes ? `
          <div class="section">
            <div class="section-title">NOTES</div>
            <div style="color: #2c3e50; font-size: 14px;">${invoice.notes}</div>
          </div>
          ` : ''}
        </div>

        <div class="footer">
          <p>This is a computer generated invoice.</p>
          <p>For any queries, please contact: ${settings?.company_phone || 'support@company.com'}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

exports.generateManufacturingPaymentReceipt = (payment, settings) => {
  const formattedDate = new Date(payment.payment_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Manufacturing Payment Receipt - ${payment.receipt_number}</title>
      <style>
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }
        }
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
          color: #333;
          line-height: 1.6;
        }
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 100px;
          opacity: 0.05;
          z-index: -1;
          color: #000;
          white-space: nowrap;
        }
        .company-header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 2px solid #333;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          margin: 0;
          color: #1976d2;
        }
        .company-details {
          font-size: 14px;
          color: #666;
          margin: 5px 0;
        }
        .document-title {
          font-size: 20px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
          color: #333;
          text-transform: uppercase;
        }
        .slip-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          padding: 15px;
          background-color: #f5f5f5;
          border-radius: 5px;
        }
        .contractor-info, .payment-info {
          flex: 1;
        }
        .info-label {
          font-weight: bold;
          color: #666;
          font-size: 12px;
          text-transform: uppercase;
        }
        .info-value {
          font-size: 14px;
          margin-bottom: 10px;
        }
        .payment-details {
          margin: 20px 0;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 20px;
          border-bottom: 1px solid #eee;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: bold;
          color: #333;
        }
        .amount {
          font-family: monospace;
          font-size: 14px;
        }
        .total-section {
          margin-top: 20px;
          padding: 15px 20px;
          background-color: #1976d2;
          color: white;
          border-radius: 5px;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
        .company-registration {
          font-size: 12px;
          color: #666;
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="watermark">PAYMENT SLIP</div>
      <div class="company-header">
        <h1 class="company-name">${settings?.company_name || 'COMPANY NAME'}</h1>
        <p class="company-details">${settings?.company_address || ''}</p>
        <p class="company-details">Phone: ${settings?.company_phone || ''}</p>
        <p class="company-registration">VAT No: ${settings?.vat_number || ''} | Tax No: ${settings?.tax_number || ''}</p>
      </div>

      <div class="document-title">Manufacturing Payment Receipt</div>

      <div class="slip-header">
        <div class="contractor-info">
          <div class="info-label">Contractor Name</div>
          <div class="info-value">${payment.contractor_name}</div>
          <div class="info-label">Receipt Number</div>
          <div class="info-value">${payment.receipt_number}</div>
        </div>
        <div class="payment-info">
          <div class="info-label">Payment Date</div>
          <div class="info-value">${formattedDate}</div>
          <div class="info-label">Status</div>
          <div class="info-value">${payment.status.toUpperCase()}</div>
        </div>
      </div>

      <div class="payment-details">
        <div class="detail-row">
          <span class="detail-label">Quantity</span>
          <span class="amount">${payment.quantity_kg} kg</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Price per kg</span>
          <span class="amount">Rs. ${(payment.amount / payment.quantity_kg).toFixed(2)}</span>
        </div>
      </div>

      <div class="total-section detail-row">
        <span class="detail-label">Total Amount</span>
        <span class="amount">Rs. ${Number(payment.amount).toLocaleString()}</span>
      </div>

      ${payment.notes ? `
      <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
        <div class="info-label">Notes</div>
        <div style="font-size: 14px; margin-top: 5px;">${payment.notes}</div>
      </div>
      ` : ''}

      <div class="footer">
        <p>Generated on ${new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })} IST</p>
        <p>For any queries, please contact ${settings?.company_name || ''} at ${settings?.company_phone || ''}</p>
      </div>
    </body>
    </html>
  `;
};