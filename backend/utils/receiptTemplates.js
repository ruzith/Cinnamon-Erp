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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="company-name">${settings?.company_name || 'COMPANY NAME'}</div>
          <div class="receipt-title">Advance Payment Receipt</div>
          <div class="receipt-number">${payment.receipt_number}</div>
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
            <div class="section-title">PAYMENT DETAILS</div>
            <div class="detail-row">
              <span class="label">Date:</span>
              <span class="value">${formattedDate}</span>
            </div>
            <div class="detail-row">
              <span class="label">Payment Method:</span>
              <span class="value">Cash</span>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">CONTRACTOR DETAILS</div>
            <div class="detail-row">
              <span class="label">Name:</span>
              <span class="value">${payment.contractor_name}</span>
            </div>
            <div class="detail-row">
              <span class="label">Contractor ID:</span>
              <span class="value">${payment.contractor_id}</span>
            </div>
          </div>
          
          <div class="amount-section">
            <div class="amount-row">
              <span>Amount Paid:</span>
              <span>Rs. ${Number(payment.amount).toLocaleString()}</span>
            </div>
          </div>
          
          ${payment.notes ? `
          <div class="section">
            <div class="section-title">NOTES</div>
            <div style="color: #2c3e50; font-size: 14px;">${payment.notes}</div>
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