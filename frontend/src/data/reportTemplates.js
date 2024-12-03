const reportTemplates = [
  // Sales Report
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
        field: 'dateRange',
        type: 'date',
        label: {
          en: 'Date Range',
          si: 'කාල සීමාව'
        }
      },
      {
        field: 'status',
        type: 'select',
        label: {
          en: 'Status',
          si: 'තත්වය'
        },
        options: [
          { value: 'completed', label: { en: 'Completed', si: 'සම්පූර්ණයි' } },
          { value: 'pending', label: { en: 'Pending', si: 'අපේක්ෂිතයි' } }
        ]
      }
    ],
    columns: [
      {
        field: 'date',
        header: { en: 'Date', si: 'දිනය' },
        format: 'date'
      },
      {
        field: 'totalSales',
        header: { en: 'Total Sales', si: 'මුළු විකුණුම්' },
        format: 'currency'
      },
      {
        field: 'itemCount',
        header: { en: 'Items Sold', si: 'විකුණන ලද අයිතම' },
        format: 'number'
      }
    ]
  },
  // ... rest of the templates remain the same
];

export default reportTemplates; 