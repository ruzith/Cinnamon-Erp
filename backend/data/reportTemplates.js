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
      },
      {
        field: 'transactionCount',
        header: { en: 'Transaction Count', si: 'ගනුදෙනු ගණන' },
        format: 'number'
      },
      {
        field: 'averageSale',
        header: { en: 'Average Sale', si: 'සාමාන්‍ය විකුණුම්' },
        format: 'currency'
      },
      {
        field: 'maxSale',
        header: { en: 'Highest Sale', si: 'උපරිම විකුණුම' },
        format: 'currency'
      },
      {
        field: 'minSale',
        header: { en: 'Lowest Sale', si: 'අවම විකුණුම' },
        format: 'currency'
      }
    ]
  },

  // Employee Report
  {
    code: 'EMPLOYEE_SUMMARY',
    name: {
      en: 'Employee Summary Report',
      si: 'සේවක සාරාංශ වාර්තාව'
    },
    category: 'hr',
    description: {
      en: 'Employee status and performance overview',
      si: 'සේවක තත්ත්වය සහ කාර්ය සාධන දළ විශ්ලේෂණය'
    },
    filters: [
      {
        field: 'department',
        type: 'select',
        label: { en: 'Department', si: 'දෙපාර්තමේන්තුව' },
        optionsUrl: '/api/reports/departments'
      },
      {
        field: 'employmentType',
        type: 'select',
        label: { en: 'Employment Type', si: 'සේවා වර්ගය' },
        options: [
          { value: 'permanent', label: { en: 'Permanent', si: 'ස්ථිර' } },
          { value: 'temporary', label: { en: 'Temporary', si: 'තාවකාලික' } }
        ]
      },
      {
        field: 'status',
        type: 'select',
        label: { en: 'Status', si: 'තත්ත්වය' },
        options: [
          { value: 'active', label: { en: 'Active', si: 'ක්‍රියාත්මක' } },
          { value: 'inactive', label: { en: 'Inactive', si: 'අක්‍රිය' } }
        ]
      }
    ],
    columns: [
      {
        field: 'name',
        header: { en: 'Name', si: 'නම' }
      },
      {
        field: 'designation',
        header: { en: 'Designation', si: 'තනතුර' }
      },
      {
        field: 'department',
        header: { en: 'Department', si: 'දෙපාර්තමේන්තුව' }
      },
      {
        field: 'employmentType',
        header: { en: 'Employment Type', si: 'සේවා වර්ගය' }
      },
      {
        field: 'status',
        header: { en: 'Status', si: 'තත්ත්වය' }
      }
    ]
  },

  // Tasks Report
  {
    code: 'TASK_SUMMARY',
    name: {
      en: 'Task Summary Report',
      si: 'කාර්ය සාරාංශ වාර්තාව'
    },
    category: 'tasks',
    description: {
      en: 'Overview of task completion and status',
      si: 'කාර්ය සම්පූර්ණ කිරීම සහ තත්ත්වය පිළිබඳ දළ විශ්ලේෂණය'
    },
    filters: [
      {
        field: 'dateRange',
        type: 'date',
        label: { en: 'Date Range', si: 'කාල සීමාව' }
      },
      {
        field: 'status',
        type: 'select',
        label: { en: 'Status', si: 'තත්ත්වය' },
        options: [
          { value: 'pending', label: { en: 'Pending', si: 'විසඳීමට ඇති' } },
          { value: 'in_progress', label: { en: 'In Progress', si: 'ක්‍රියාත්මක වෙමින්' } },
          { value: 'completed', label: { en: 'Completed', si: 'සම්පූර්ණයි' } }
        ]
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
        field: 'taskId',
        header: { en: 'Task ID', si: 'කාර්ය හැඳුනුම' }
      },
      {
        field: 'title',
        header: { en: 'Title', si: 'මාතෘකාව' }
      },
      {
        field: 'assignee',
        header: { en: 'Assignee', si: 'භාරකරු' }
      },
      {
        field: 'dueDate',
        header: { en: 'Due Date', si: 'නියමිත දිනය' },
        format: 'date'
      },
      {
        field: 'status',
        header: { en: 'Status', si: 'තත්ත්වය' }
      },
      {
        field: 'priority',
        header: { en: 'Priority', si: 'ප්‍රමුඛතාව' }
      },
      {
        field: 'estimatedHours',
        header: { en: 'Estimated Hours', si: 'ඇස්තමේන්තුගත පැය' },
        format: 'number'
      }
    ]
  },

  // Manufacturing Purchasing Report
  {
    code: 'MANUFACTURING_PURCHASING',
    name: {
      en: 'Manufacturing Purchasing Report',
      si: 'නිෂ්පාදන මිලදී ගැනීම් වාර්තාව'
    },
    category: 'manufacturing',
    description: {
      en: 'Analysis of raw material purchases and supplier performance',
      si: 'අමු ද්‍රව්‍ය මිලදී ගැනීම් සහ සැපයුම්කරු කාර්යසාධනය විශ්ලේෂණය'
    },
    filters: [
      {
        field: 'dateRange',
        type: 'date',
        label: { en: 'Date Range', si: 'කාල සීමාව' }
      }
    ],
    columns: [
      {
        field: 'date',
        header: { en: 'Date', si: 'දිනය' },
        format: 'date'
      },
      {
        field: 'invoiceNumber',
        header: { en: 'Invoice Number', si: 'ඉන්වොයිස් අංකය' }
      },
      {
        field: 'materialName',
        header: { en: 'Material', si: 'ද්‍රව්‍ය' }
      },
      {
        field: 'quantity',
        header: { en: 'Quantity', si: 'ප්‍රමාණය' },
        format: 'number'
      },
      {
        field: 'unitPrice',
        header: { en: 'Unit Price', si: 'ඒකක මිල' },
        format: 'currency'
      },
      {
        field: 'totalAmount',
        header: { en: 'Total Amount', si: 'මුළු මුදල' },
        format: 'currency'
      }
    ]
  }
];

module.exports = reportTemplates;