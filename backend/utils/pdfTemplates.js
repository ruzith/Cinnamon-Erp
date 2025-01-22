const commonStyles = `
  @media print {
    @page {
      size: A4;
      margin: 12mm;
    }
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    padding: 20px;
    max-width: 210mm;
    margin: 0 auto;
    color: #2c3e50;
    line-height: 1.4;
    background-color: #fff;
    min-height: 100vh;
    position: relative;
  }

  .company-header {
    text-align: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #e0e0e0;
  }

  .company-name {
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 5px;
    color: #1976d2;
    letter-spacing: 0.5px;
  }

  .company-details {
    font-size: 11px;
    color: #546e7a;
    margin: 2px 0;
    line-height: 1.3;
  }

  .document-title {
    font-size: 18px;
    font-weight: 700;
    text-align: center;
    margin: 15px 0;
    color: #2c3e50;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .grid-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin: 15px 0;
  }

  .grid-item {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
  }

  .info-label {
    font-weight: 600;
    color: #546e7a;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 3px;
  }

  .info-value {
    font-size: 12px;
    color: #2c3e50;
    margin-bottom: 8px;
    line-height: 1.3;
  }

  .details-table {
    margin: 15px 0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }

  .details-table table {
    width: 100%;
    border-collapse: collapse;
  }

  .details-table th,
  .details-table td {
    padding: 8px 12px;
    font-size: 11px;
    border-bottom: 1px solid #e0e0e0;
  }

  .details-table th {
    background: #f5f7fa;
    font-weight: 600;
    color: #546e7a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .total-section {
    margin: 15px 0;
    padding: 12px 15px;
    background: linear-gradient(135deg, #1976d2, #1565c0);
    color: white;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .total-section .detail-label {
    font-weight: 600;
    font-size: 13px;
    letter-spacing: 0.5px;
  }

  .total-section .amount {
    font-size: 14px;
    font-weight: 600;
  }

  .footer {
    position: absolute;
    bottom: 20px;
    left: 0;
    right: 0;
    padding-top: 15px;
    border-top: 1px solid #e0e0e0;
    font-size: 9px;
    color: #78909c;
    text-align: center;
    line-height: 1.4;
  }

  .payment-status {
    display: inline-block;
    padding: 3px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .notes-section {
    margin: 15px 0;
    padding: 12px 15px;
    background-color: #f8f9fa;
    border-radius: 8px;
    border-left: 3px solid #1976d2;
    font-size: 11px;
  }

  .amount {
    font-family: 'Roboto Mono', monospace;
    font-size: 11px;
    white-space: nowrap;
  }

  .watermark {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 100px;
    opacity: 0.02;
    z-index: -1;
    color: #000;
    white-space: nowrap;
    font-weight: 900;
  }
`;

exports.generateAdvancePaymentReceipt = async (payment, settings = {}) => {
  const currencySymbol = settings?.currency_symbol || 'Rs.';
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
      <style>${commonStyles}</style>
    </head>
    <body>
      <div class="watermark">ADVANCE PAYMENT</div>

      <div class="company-header">
        <h1 class="company-name">${settings?.company_name || 'COMPANY NAME'}</h1>
        <p class="company-details">${settings?.company_address || ''}</p>
        <p class="company-details">Phone: ${settings?.company_phone || ''}</p>
        <p class="company-registration">VAT No: ${settings?.vat_number || ''} | Tax No: ${settings?.tax_number || ''}</p>
      </div>

      <div class="document-title">Advance Payment Receipt</div>

      <div class="grid-container">
        <div class="grid-item">
          <div class="info-label">Contractor Details</div>
          <div class="info-value" style="font-size: 16px; font-weight: 600;">${payment.contractor_name}</div>
          <div class="info-label">Contractor ID</div>
          <div class="info-value">${payment.contractor_id}</div>
        </div>
        <div class="grid-item">
          <div class="info-label">Receipt Number</div>
          <div class="info-value">${payment.receipt_number}</div>
          <div class="info-label">Payment Date</div>
          <div class="info-value">${formattedDate}</div>
        </div>
      </div>

      <div class="details-table">
        <table style="width: 100%">
          <thead>
            <tr>
              <th>Payment Details</th>
              <th style="text-align: right">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Payment Method</td>
              <td style="text-align: right">Cash</td>
            </tr>
            <tr>
              <td>Payment Type</td>
              <td style="text-align: right">Advance Payment</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="total-section">
        <span class="detail-label">Total Amount</span>
        <span class="amount">${currencySymbol} ${Number(payment.amount).toLocaleString()}</span>
      </div>

      ${payment.notes ? `
        <div class="notes-section">
          <div class="info-label">Notes</div>
          <div style="margin-top: 8px;">${payment.notes}</div>
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
        <p>This is a computer generated receipt</p>
        <p>For any queries, please contact us at ${settings?.company_phone || ''}</p>
      </div>
    </body>
    </html>
  `;
};

exports.generateCuttingPaymentReceipt = async (payment, settings = {}) => {
  const currencySymbol = settings?.currency_symbol || 'Rs.';
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
      <style>${commonStyles}</style>
    </head>
    <body>
      <div class="watermark">CUTTING PAYMENT</div>

      <div class="company-header">
        <h1 class="company-name">${settings?.company_name || 'COMPANY NAME'}</h1>
        <p class="company-details">${settings?.company_address || ''}</p>
        <p class="company-details">Phone: ${settings?.company_phone || ''}</p>
        <p class="company-registration">VAT No: ${settings?.vat_number || ''} | Tax No: ${settings?.tax_number || ''}</p>
      </div>

      <div class="document-title">Cutting Payment Receipt</div>

      <div class="grid-container">
        <div class="grid-item">
          <div class="info-label">Contractor Details</div>
          <div class="info-value" style="font-size: 16px; font-weight: 600;">${payment.contractor_name}</div>
          <div class="info-label">Receipt Number</div>
          <div class="info-value">${payment.receipt_number}</div>
        </div>
        <div class="grid-item">
          <div class="info-label">Land Number</div>
          <div class="info-value">${payment.land_number || 'N/A'}</div>
          <div class="info-label">Payment Date</div>
          <div class="info-value">${formattedDate}</div>
        </div>
      </div>

      <div class="details-table">
        <table style="width: 100%">
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Location</td>
              <td style="text-align: right">${payment.location || 'N/A'}</td>
            </tr>
            <tr>
              <td>Company Contribution</td>
              <td style="text-align: right" class="amount">
                ${currencySymbol} ${Number(payment.company_contribution).toLocaleString()}
              </td>
            </tr>
            <tr>
              <td>Manufacturing Contribution</td>
              <td style="text-align: right" class="amount">
                ${currencySymbol} ${Number(payment.manufacturing_contribution).toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="total-section">
        <span class="detail-label">Total Amount</span>
        <span class="amount">${currencySymbol} ${Number(payment.total_amount).toLocaleString()}</span>
      </div>

      ${payment.notes ? `
        <div class="notes-section">
          <div class="info-label">Notes</div>
          <div style="margin-top: 8px;">${payment.notes}</div>
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
        <p>This is a computer generated receipt</p>
        <p>For any queries, please contact us at ${settings?.company_phone || ''}</p>
      </div>
    </body>
    </html>
  `;
};

exports.generateManufacturingInvoice = async (invoice, settings = {}) => {
  const currencySymbol = settings?.currency_symbol || 'Rs.';
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
      <style>${commonStyles}</style>
    </head>
    <body>
      <div class="watermark">MANUFACTURING</div>

      <div class="company-header">
        <h1 class="company-name">${settings?.company_name || 'COMPANY NAME'}</h1>
        <p class="company-details">${settings?.company_address || ''}</p>
        <p class="company-details">Phone: ${settings?.company_phone || ''}</p>
        <p class="company-registration">VAT No: ${settings?.vat_number || ''} | Tax No: ${settings?.tax_number || ''}</p>
      </div>

      <div class="document-title">Manufacturing Invoice</div>

      <div class="grid-container">
        <div class="grid-item">
          ${invoice.contractor_name ? `
            <div class="info-label">Contractor Details</div>
            <div class="info-value" style="font-size: 16px; font-weight: 600;">${invoice.contractor_name}</div>
            <div class="info-label">Contractor ID</div>
            <div class="info-value">${invoice.contractor_id}</div>
          ` : ''}
        </div>
        <div class="grid-item">
          <div class="info-label">Invoice Number</div>
          <div class="info-value">${invoice.invoice_number}</div>
          <div class="info-label">Date</div>
          <div class="info-value">${formattedDate}</div>
          <div class="info-label">Payment Status</div>
          <div class="info-value">
            <span class="payment-status ${invoice.payment_status === 'paid' ? 'paid' : 'pending'}">
              ${invoice.payment_status || 'Pending'}
            </span>
          </div>
        </div>
      </div>

      <div class="details-table">
        <table style="width: 100%">
          <thead>
            <tr>
              <th>Product</th>
              <th style="text-align: center">Quantity</th>
              <th style="text-align: right">Unit Price</th>
              <th style="text-align: right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${invoice.product_name}</td>
              <td style="text-align: center">${invoice.quantity} ${invoice.unit || 'units'}</td>
              <td style="text-align: right" class="amount">
                ${currencySymbol} ${Number(invoice.unit_price || 0).toLocaleString()}
              </td>
              <td style="text-align: right" class="amount">
                ${currencySymbol} ${Number(invoice.total_amount || 0).toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="display: flex; gap: 30px; margin-top: 30px;">
        <div style="flex: 1;">
          ${invoice.notes ? `
            <div class="notes-section">
              <div class="info-label">Notes</div>
              <div style="margin-top: 8px;">${invoice.notes}</div>
            </div>
          ` : ''}
        </div>

        <div style="flex: 1;">
          <div style="background: #f8f9fa; border-radius: 8px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0;">
                  <span style="color: #546e7a; font-size: 11px; font-weight: 600;">Subtotal</span>
                </td>
                <td style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #e0e0e0;">
                  <span class="amount">${currencySymbol} ${Number(invoice.subtotal || 0).toLocaleString()}</span>
                </td>
              </tr>
              ${invoice.tax_amount ? `
                <tr>
                  <td style="padding: 10px 15px;">
                    <span style="color: #546e7a; font-size: 11px; font-weight: 600;">Tax (${invoice.tax_rate || 0}%)</span>
                  </td>
                  <td style="padding: 10px 15px; text-align: right;">
                    <span class="amount">${currencySymbol} ${Number(invoice.tax_amount).toLocaleString()}</span>
                  </td>
                </tr>
              ` : ''}
            </table>
          </div>

          <div class="total-section" style="margin-top: 10px;">
            <span class="detail-label">Total Amount</span>
            <span class="amount">${currencySymbol} ${Number(invoice.total_amount || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Generated on ${new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })} IST</p>
        <p>This is a computer generated invoice</p>
        <p>For any queries, please contact us at ${settings?.company_phone || ''}</p>
      </div>
    </body>
    </html>
  `;
};

exports.generateManufacturingPaymentReceipt = async (payment, settings = {}) => {
  const currencySymbol = settings?.currency_symbol || 'Rs.';
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
      <style>${commonStyles}</style>
    </head>
    <body>
      <div class="watermark">MANUFACTURING</div>

      <div class="company-header">
        <h1 class="company-name">${settings?.company_name || 'COMPANY NAME'}</h1>
        <p class="company-details">${settings?.company_address || ''}</p>
        <p class="company-details">Phone: ${settings?.company_phone || ''}</p>
        <p class="company-registration">VAT No: ${settings?.vat_number || ''} | Tax No: ${settings?.tax_number || ''}</p>
      </div>

      <div class="document-title">Manufacturing Payment Receipt</div>

      <div class="grid-container">
        <div class="grid-item">
          <div class="info-label">Contractor Details</div>
          <div class="info-value" style="font-size: 16px; font-weight: 600;">${payment.contractor_name}</div>
          <div class="info-label">Receipt Number</div>
          <div class="info-value">${payment.receipt_number}</div>
        </div>
        <div class="grid-item">
          <div class="info-label">Payment Date</div>
          <div class="info-value">${formattedDate}</div>
          <div class="info-label">Status</div>
          <div class="info-value">
            <span class="payment-status ${payment.status.toLowerCase() === 'paid' ? 'paid' : 'pending'}">
              ${payment.status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div class="details-table">
        <table style="width: 100%">
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Quantity</td>
              <td style="text-align: right">${payment.quantity_kg} kg</td>
            </tr>
            <tr>
              <td>Price per kg</td>
              <td style="text-align: right" class="amount">
                ${currencySymbol} ${(payment.amount / payment.quantity_kg).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="total-section">
        <span class="detail-label">Total Amount</span>
        <span class="amount">${currencySymbol} ${Number(payment.amount).toLocaleString()}</span>
      </div>

      ${payment.notes ? `
        <div class="notes-section">
          <div class="info-label">Notes</div>
          <div style="margin-top: 8px;">${payment.notes}</div>
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
        <p>This is a computer generated receipt</p>
        <p>For any queries, please contact us at ${settings?.company_phone || ''}</p>
      </div>
    </body>
    </html>
  `;
};

exports.generateSalesInvoice = async (sale, settings = {}, items = []) => {
  const currencySymbol = settings?.currency_symbol || 'Rs.';
  const formattedDate = new Date(sale.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Sales Invoice - ${sale.invoice_number}</title>
      <style>${commonStyles}</style>
    </head>
    <body>
      <div class="watermark">SALES INVOICE</div>

      <div class="company-header">
        <h1 class="company-name">${settings?.company_name || 'COMPANY NAME'}</h1>
        <p class="company-details">${settings?.company_address || ''}</p>
        <p class="company-details">Phone: ${settings?.company_phone || ''}</p>
        <p class="company-registration">VAT No: ${settings?.vat_number || ''} | Tax No: ${settings?.tax_number || ''}</p>
      </div>

      <div class="document-title">Sales Invoice</div>

      <div class="grid-container">
        <div class="grid-item">
          <div class="info-label">Invoice To</div>
          <div class="info-value" style="font-size: 16px; font-weight: 600;">${sale.customer_name}</div>
          <div class="info-value">${sale.customer_address || ''}</div>
          <div class="info-value">${sale.customer_phone || ''}</div>
          <div class="info-value">${sale.customer_email || ''}</div>
        </div>
        <div class="grid-item">
          <div class="info-label">Invoice Number</div>
          <div class="info-value">${sale.invoice_number}</div>
          <div class="info-label">Date</div>
          <div class="info-value">${formattedDate}</div>
          <div class="info-label">Payment Status</div>
          <div class="info-value">
            <span class="payment-status ${sale.payment_status === 'paid' ? 'paid' : 'pending'}">
              ${sale.payment_status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div class="details-table">
        <table style="width: 100%">
          <thead>
            <tr>
              <th>Item Description</th>
              <th style="text-align: center">Quantity</th>
              <th style="text-align: center">Unit</th>
              <th style="text-align: right">Unit Price</th>
              <th style="text-align: right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.product_name}</td>
                <td style="text-align: center">${item.quantity}</td>
                <td style="text-align: center">${item.unit || ''}</td>
                <td style="text-align: right" class="amount">
                  ${currencySymbol} ${Number(item.unit_price).toFixed(2)}
                </td>
                <td style="text-align: right" class="amount">
                  ${currencySymbol} ${Number(item.sub_total).toFixed(2)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div style="display: flex; gap: 30px; margin-top: 30px;">
        <div style="flex: 1;">
          ${sale.notes ? `
            <div class="notes-section">
              <div class="info-label">Notes</div>
              <div style="margin-top: 8px;">${sale.notes}</div>
            </div>
          ` : ''}

          <div style="background: #f8f9fa; border-radius: 8px; overflow: hidden; margin-top: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 15px;">
                  <span style="color: #546e7a; font-size: 11px; font-weight: 600;">Payment Method</span>
                </td>
                <td style="padding: 10px 15px; text-align: right;">
                  <span style="font-size: 11px;">${sale.payment_method.toUpperCase()}</span>
                </td>
              </tr>
            </table>
          </div>
        </div>

        <div style="flex: 1;">
          <div style="background: #f8f9fa; border-radius: 8px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0;">
                  <span style="color: #546e7a; font-size: 11px; font-weight: 600;">Subtotal</span>
                </td>
                <td style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #e0e0e0;">
                  <span class="amount">${currencySymbol} ${Number(sale.sub_total).toFixed(2)}</span>
                </td>
              </tr>
              ${Number(sale.discount) > 0 ? `
                <tr>
                  <td style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0;">
                    <span style="color: #546e7a; font-size: 11px; font-weight: 600;">Discount</span>
                  </td>
                  <td style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #e0e0e0;">
                    <span class="amount" style="color: #e53935;">-${currencySymbol} ${Number(sale.discount).toFixed(2)}</span>
                  </td>
                </tr>
              ` : ''}
              ${Number(sale.tax) > 0 ? `
                <tr>
                  <td style="padding: 10px 15px;">
                    <span style="color: #546e7a; font-size: 11px; font-weight: 600;">Tax</span>
                  </td>
                  <td style="padding: 10px 15px; text-align: right;">
                    <span class="amount">${currencySymbol} ${Number(sale.tax).toFixed(2)}</span>
                  </td>
                </tr>
              ` : ''}
            </table>
          </div>

          <div class="total-section" style="margin-top: 10px;">
            <span class="detail-label">Total Amount</span>
            <span class="amount">${currencySymbol} ${Number(sale.total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Generated on ${new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })} IST</p>
        <p>Thank you for your business!</p>
        <p>For any queries, please contact us at ${settings?.company_phone || ''}</p>
      </div>
    </body>
    </html>
  `;
};

exports.generatePayrollSlip = async (payroll, settings = {}) => {
  const currencySymbol = settings?.currency_symbol || 'Rs.';
  const formattedDate = new Date(payroll.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Payroll Slip - ${payroll.employee_name}</title>
        <style>${commonStyles}</style>
      </head>
      <body>
        <div class="watermark">PAYROLL</div>

        <div class="company-header">
          <h1 class="company-name">${settings?.company_name || 'COMPANY NAME'}</h1>
          <p class="company-details">${settings?.company_address || ''}</p>
          <p class="company-details">Phone: ${settings?.company_phone || ''}</p>
          <p class="company-registration">VAT No: ${settings?.vat_number || ''} | Tax No: ${settings?.tax_number || ''}</p>
        </div>

        <div class="document-title">Payroll Slip</div>

        <div class="grid-container">
          <div class="grid-item">
            <div class="info-label">Employee Name</div>
            <div class="info-value">${payroll.employee_name}</div>
            <div class="info-label">Employee ID</div>
            <div class="info-value">${payroll.employee_id}</div>
          </div>
          <div class="grid-item">
            <div class="info-label">Department</div>
            <div class="info-value">${payroll.department || 'N/A'}</div>
            <div class="info-label">Pay Period</div>
            <div class="info-value">${formattedDate}</div>
          </div>
        </div>

        <div class="details-table">
          <table style="width: 100%">
            <thead>
              <tr>
                <th>Earnings</th>
                <th style="text-align: right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Basic Salary</td>
                <td style="text-align: right" class="amount">
                  ${currencySymbol} ${Number(payroll.basic_salary).toFixed(2)}
                </td>
              </tr>
              ${payroll.additional_amounts?.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td style="text-align: right" class="amount">
                    ${currencySymbol} ${Number(item.amount).toFixed(2)}
                  </td>
                </tr>
              `).join('') || ''}
              <tr style="background-color: #f8f9fa; font-weight: 600;">
                <td>Total Earnings</td>
                <td style="text-align: right" class="amount">
                  ${currencySymbol} ${Number(payroll.total_earnings).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="details-table" style="margin-top: 20px;">
          <table style="width: 100%">
            <thead>
              <tr>
                <th>Deductions</th>
                <th style="text-align: right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${payroll.deduction_items?.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td style="text-align: right" class="amount">
                    -${currencySymbol} ${Number(item.amount).toFixed(2)}
                  </td>
                </tr>
              `).join('') || ''}
              <tr style="background-color: #f8f9fa; font-weight: 600;">
                <td>Total Deductions</td>
                <td style="text-align: right" class="amount">
                  -${currencySymbol} ${Number(payroll.deductions).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="total-section">
          <span class="detail-label">Net Salary</span>
          <span class="amount">${currencySymbol} ${Number(payroll.net_salary).toFixed(2)}</span>
        </div>

        <div class="footer">
          <p>Generated on ${new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })} IST</p>
          <p>This is a computer generated payroll slip</p>
          <p>For any queries, please contact HR Department at ${settings?.company_phone || ''}</p>
        </div>
      </body>
    </html>
  `;
};