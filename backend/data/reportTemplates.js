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
        field: 'status',
        header: { en: 'Status', si: 'තත්ත්වය' }
      }
    ]
  },

  // Cutting Report
  {
    code: 'CUTTING_PERFORMANCE',
    name: {
      en: 'Cutting Performance Report',
      si: 'කැපීම් කාර්යසාධන වාර්තාව'
    },
    category: 'cutting',
    description: {
      en: 'Analysis of cutting operations and contractor performance',
      si: 'කැපීම් මෙහෙයුම් සහ කොන්ත්‍රාත්කරු කාර්යසාධනය විශ්ලේෂණය'
    },
    filters: [
      {
        field: 'dateRange',
        type: 'date',
        label: { en: 'Date Range', si: 'කාල සීමාව' }
      },
      {
        field: 'contractor',
        type: 'select',
        label: { en: 'Contractor', si: 'කොන්ත්‍රාත්කරු' }
      }
    ],
    columns: [
      {
        field: 'contractorName',
        header: { en: 'Contractor', si: 'කොන්ත්‍රාත්කරු' }
      },
      {
        field: 'areaCovered',
        header: { en: 'Area Covered', si: 'ආවරණය කළ ප්‍රදේශය' },
        format: 'number'
      },
      {
        field: 'efficiency',
        header: { en: 'Efficiency', si: 'කාර්යක්ෂමතාව' },
        format: 'percentage'
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
        field: 'completionRate',
        header: { en: 'Completion Rate', si: 'සම්පූර්ණ කිරීමේ අනුපාතය' },
        format: 'percentage'
      }
    ]
  },

  // Manufacturing Advanced Report
  {
    code: 'MANUFACTURING_ADVANCED',
    name: {
      en: 'Manufacturing Advanced Report',
      si: 'නිෂ්පාදන උසස් වාර්තාව'
    },
    category: 'manufacturing',
    description: {
      en: 'Detailed analysis of manufacturing processes and efficiency',
      si: 'නිෂ්පාදන ක්‍රියාවලීන් සහ කාර්යක්ෂමතාව පිළිබඳ සවිස්තර විශ්ලේෂණය'
    },
    filters: [
      {
        field: 'dateRange',
        type: 'date',
        label: { en: 'Date Range', si: 'කාල සීමාව' }
      },
      {
        field: 'productLine',
        type: 'select',
        label: { en: 'Product Line', si: 'නිෂ්පාදන පෙළ' },
        optionsUrl: '/api/reports/product-lines'
      },
      {
        field: 'efficiency',
        type: 'select',
        label: { en: 'Efficiency Level', si: 'කාර්යක්ෂමතා මට්ටම' },
        options: [
          { value: 'high', label: { en: 'High (>90%)', si: 'ඉහළ (>90%)' } },
          { value: 'medium', label: { en: 'Medium (70-90%)', si: 'මධ්‍යම (70-90%)' } },
          { value: 'low', label: { en: 'Low (<70%)', si: 'අඩු (<70%)' } }
        ]
      }
    ],
    columns: [
      {
        field: 'productLine',
        header: { en: 'Product Line', si: 'නිෂ්පාදන පෙළ' }
      },
      {
        field: 'outputQuantity',
        header: { en: 'Output Quantity', si: 'නිමැවුම් ප්‍රමාණය' },
        format: 'number'
      },
      {
        field: 'defectRate',
        header: { en: 'Defect Rate', si: 'දෝෂ අනුපාතය' },
        format: 'percentage'
      },
      {
        field: 'efficiency',
        header: { en: 'Efficiency', si: 'කාර්යක්ෂමතාව' },
        format: 'percentage'
      },
      {
        field: 'downtime',
        header: { en: 'Downtime (Hours)', si: 'අක්‍රීය කාලය (පැය)' },
        format: 'number'
      },
      {
        field: 'costPerUnit',
        header: { en: 'Cost Per Unit', si: 'ඒකක පිරිවැය' },
        format: 'currency'
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
      },
      {
        field: 'materialCategory',
        type: 'select',
        label: { en: 'Material Category', si: 'ද්‍රව්‍ය වර්ගය' },
        optionsUrl: '/api/reports/material-categories'
      }
    ],
    columns: [
      {
        field: 'materialCode',
        header: { en: 'Material Code', si: 'ද්‍රව්‍ය කේතය' }
      },
      {
        field: 'materialName',
        header: { en: 'Material Name', si: 'ද්‍රව්‍ය නාමය' }
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
        field: 'totalCost',
        header: { en: 'Total Cost', si: 'මුළු පිරිවැය' },
        format: 'currency'
      },
      {
        field: 'deliveryTime',
        header: { en: 'Delivery Time (Days)', si: 'බෙදාහැරීමේ කාලය (දින)' },
        format: 'number'
      }
    ]
  }
];

module.exports = reportTemplates; 