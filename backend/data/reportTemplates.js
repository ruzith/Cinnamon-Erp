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

  // Task Report
  {
    code: 'TASK_STATUS',
    name: {
      en: 'Task Status Report',
      si: 'කාර්ය තත්ව වාර්තාව'
    },
    category: 'tasks',
    description: {
      en: 'Overview of task completion status',
      si: 'කාර්ය සම්පූර්ණ කිරීමේ තත්වය පිළිබඳ දළ විශ්ලේෂණය'
    },
    filters: [
      {
        field: 'dateRange',
        type: 'date',
        label: { en: 'Date Range', si: 'කාල සීමාව' }
      },
      {
        field: 'priority',
        type: 'select',
        label: { en: 'Priority', si: 'ප්‍රමුඛතාව' },
        options: [
          { value: 'high', label: { en: 'High', si: 'ඉහළ' } },
          { value: 'medium', label: { en: 'Medium', si: 'මධ්‍යම' } },
          { value: 'low', label: { en: 'Low', si: 'අඩු' } }
        ]
      }
    ],
    columns: [
      {
        field: 'title',
        header: { en: 'Task', si: 'කාර්යය' }
      },
      {
        field: 'status',
        header: { en: 'Status', si: 'තත්වය' }
      },
      {
        field: 'assignedTo',
        header: { en: 'Assigned To', si: 'භාර දී ඇත' }
      }
    ]
  },

  // Asset Report
  {
    code: 'ASSET_SUMMARY',
    name: {
      en: 'Asset Summary Report',
      si: 'වත්කම් සාරාංශ වාර්තාව'
    },
    category: 'assets',
    description: {
      en: 'Summary of asset values and depreciation',
      si: 'වත්කම් වටිනාකම් සහ ක්ෂය වීම් සාරාංශය'
    },
    filters: [
      {
        field: 'category',
        type: 'select',
        label: { en: 'Asset Category', si: 'වත්කම් වර්ගය' }
      }
    ],
    columns: [
      {
        field: 'name',
        header: { en: 'Asset Name', si: 'වත්කම් නම' }
      },
      {
        field: 'purchaseValue',
        header: { en: 'Purchase Value', si: 'මිලදී ගැනීමේ වටිනාකම' },
        format: 'currency'
      },
      {
        field: 'currentValue',
        header: { en: 'Current Value', si: 'වර්තමාන වටිනාකම' },
        format: 'currency'
      },
      {
        field: 'depreciation',
        header: { en: 'Depreciation', si: 'ක්ෂය වීම' },
        format: 'currency'
      }
    ]
  }
  // Add more report templates...
];

module.exports = reportTemplates; 