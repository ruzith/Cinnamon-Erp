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
  }
];

module.exports = reportTemplates; 