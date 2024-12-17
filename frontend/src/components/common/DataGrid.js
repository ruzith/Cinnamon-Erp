import React from 'react';
import {
  DataGrid as MuiDataGrid,
  GridToolbar
} from '@mui/x-data-grid';
import { Box } from '@mui/material';

const DataGrid = ({
  rows,
  columns,
  loading = false,
  pageSize = 10,
  checkboxSelection = false,
  onSelectionChange,
  ...props
}) => {
  return (
    <Box sx={{ height: 400, width: '100%' }}>
      <MuiDataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        pageSize={pageSize}
        rowsPerPageOptions={[5, 10, 20]}
        checkboxSelection={checkboxSelection}
        disableSelectionOnClick
        components={{
          Toolbar: GridToolbar,
        }}
        onSelectionModelChange={onSelectionChange}
        {...props}
      />
    </Box>
  );
};

export default DataGrid; 