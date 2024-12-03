const reportTemplates = [
  {
    code: 'SALES_SUMMARY',
    name: {
      en: 'Sales Summary Report',
      si: 'විකුණුම් සාරාංශ වාර්තාව'
    },
    category: 'sales',
    description: {
      en: 'Summary of sales by period with totals',
      si: 'කාල සීමාව අනුව විකුණුම් සාරාංශය'
    },
    filters: [
      {
        field: 'date',
        type: 'date',
        label: {
          en: 'Date Range',
          si: 'කාල සීමාව'
        }
      }
    ],
    columns: [
      {
        field: 'date',
        header: {
          en: 'Date',
          si: 'දිනය'
        },
        format: 'date'
      },
      {
        field: 'totalSales',
        header: {
          en: 'Total Sales',
          si: 'මුළු විකුණුම්'
        },
        format: 'currency'
      }
    ],
    query: JSON.stringify([
      {
        $match: {
          status: 'completed'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          totalSales: { $sum: '$totalAmount' }
        }
      },
      {
        $project: {
          _id: 0,
          date: { $dateFromString: { dateString: '$_id' } },
          totalSales: 1
        }
      },
      {
        $sort: { date: 1 }
      }
    ])
  }
  // Add more report templates...
];

module.exports = reportTemplates; 