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
  // Manufacturing Report
  {
    code: 'MANUFACTURING_SUMMARY',
    name: {
      en: 'Manufacturing Summary Report',
      si: 'නිෂ්පාදන සාරාංශ වාර්තාව'
    },
    category: 'manufacturing',
    description: {
      en: 'Overview of manufacturing orders and production status',
      si: 'නිෂ්පාදන ඇණවුම් සහ නිෂ්පාදන තත්ත්වය පිළිබඳ දළ විශ්ලේෂණය'
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
          { value: 'planned', label: { en: 'Planned', si: 'සැලසුම් කළ' } },
          { value: 'in_progress', label: { en: 'In Progress', si: 'ක්‍රියාත්මක වෙමින්' } },
          { value: 'completed', label: { en: 'Completed', si: 'සම්පූර්ණයි' } }
        ]
      }
    ],
    columns: [
      {
        field: 'orderNumber',
        header: { en: 'Order Number', si: 'ඇණවුම් අංකය' }
      },
      {
        field: 'product',
        header: { en: 'Product', si: 'නිෂ්පාදනය' }
      },
      {
        field: 'quantity',
        header: { en: 'Quantity', si: 'ප්‍රමාණය' },
        format: 'number'
      },
      {
        field: 'completionRate',
        header: { en: 'Completion Rate', si: 'සම්පූර්ණ කිරීමේ අනුපාතය' },
        format: 'percentage'
      }
    ]
  },
  // Inventory Report
  {
    code: 'INVENTORY_STATUS',
    name: {
      en: 'Inventory Status Report',
      si: 'තොග තත්ත්ව වාර්තාව'
    },
    category: 'inventory',
    description: {
      en: 'Current inventory levels and stock status',
      si: 'වර්තමාන තොග මට්ටම් සහ තොග තත්ත්වය'
    },
    filters: [
      {
        field: 'category',
        type: 'select',
        label: { en: 'Category', si: 'වර්ගය' },
        options: [
          { value: 'raw_material', label: { en: 'Raw Material', si: 'අමු ද්‍රව්‍ය' } },
          { value: 'finished_good', label: { en: 'Finished Good', si: 'අවසන් භාණ්ඩ' } }
        ]
      },
      {
        field: 'stockLevel',
        type: 'select',
        label: { en: 'Stock Level', si: 'තොග මට්ටම' },
        options: [
          { value: 'low', label: { en: 'Low Stock', si: 'අඩු තොග' } },
          { value: 'normal', label: { en: 'Normal', si: 'සාමාන්‍ය' } },
          { value: 'high', label: { en: 'High Stock', si: 'අධික තොග' } }
        ]
      }
    ],
    columns: [
      {
        field: 'productName',
        header: { en: 'Product Name', si: 'නිෂ්පාදන නාමය' }
      },
      {
        field: 'quantity',
        header: { en: 'Quantity', si: 'ප්‍රමාණය' },
        format: 'number'
      },
      {
        field: 'minStock',
        header: { en: 'Min Stock', si: 'අවම තොගය' },
        format: 'number'
      },
      {
        field: 'maxStock',
        header: { en: 'Max Stock', si: 'උපරිම තොගය' },
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
        label: { en: 'Department', si: 'දෙපාර්තමේන්තුව' }
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
        field: 'materialCode',
        header: { en: 'Material Code', si: 'ද්‍රව්‍ය කේතය' }
      },
      {
        field: 'materialName',
        header: { en: 'Material Name', si: 'ද්‍රව්‍ය නාමය' }
      },
      {
        field: 'quantity',
        header: { en: 'Total Quantity', si: 'මුළු ප්‍රමාණය' },
        format: 'number'
      },
      {
        field: 'unitPrice',
        header: { en: 'Average Unit Price', si: 'සාමාන්‍ය ඒකක මිල' },
        format: 'currency'
      },
      {
        field: 'totalCost',
        header: { en: 'Total Cost', si: 'මුළු පිරිවැය' },
        format: 'currency'
      },
      {
        field: 'deliveryTime',
        header: { en: 'Avg. Delivery Time (Days)', si: 'සාමාන්‍ය බෙදාහැරීමේ කාලය (දින)' },
        format: 'number'
      },
      {
        field: 'orderCount',
        header: { en: 'Number of Orders', si: 'ඇණවුම් ගණන' },
        format: 'number'
      },
      {
        field: 'minPrice',
        header: { en: 'Lowest Price', si: 'අවම මිල' },
        format: 'currency'
      },
      {
        field: 'maxPrice',
        header: { en: 'Highest Price', si: 'උපරිම මිල' },
        format: 'currency'
      },
      {
        field: 'averageOrderValue',
        header: { en: 'Average Order Value', si: 'සාමාන්‍ය ඇණවුම් වටිනාකම' },
        format: 'currency'
      }
    ]
  },
  // Task Summary Report
  {
    code: 'TASK_SUMMARY',
    name: {
      en: 'Task Summary Report',
      si: 'කාර්ය සාරාංශ වාර්තාව'
    },
    category: 'hr',
    description: {
      en: 'Overview of tasks and their status',
      si: 'කාර්ය සහ තත්ත්වය පිළිබඳ දළ විශ්ලේෂණය'
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
  }
];

export default reportTemplates;