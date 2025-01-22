import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import { getReportTemplates, generateReport, getReportPreview } from '../features/reports/reportSlice';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ClearIcon from '@mui/icons-material/Clear';
import { useSnackbar } from 'notistack';

const Reports = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { templates = [], currentReport = null, previewData = null, isLoading = false, isError = false, message = '' } = useSelector(state => state.reports || {});
  const { enqueueSnackbar } = useSnackbar();

  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [filters, setFilters] = useState({});
  const [language, setLanguage] = useState('en');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [filterOptions, setFilterOptions] = useState({});

  useEffect(() => {
    if (user?.token) {
      dispatch(getReportTemplates());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (templates?.length > 0 && selectedTemplate && user?.token) {
      const template = templates.find(t => t.code === selectedTemplate);
      if (!template) {
        setSelectedTemplate('');
      } else {
        template.filters.forEach(filter => {
          if (filter.optionsUrl) {
            fetch(filter.optionsUrl, {
              headers: {
                Authorization: `Bearer ${user.token}`
              }
            })
              .then(res => res.json())
              .then(data => setFilterOptions(prev => ({
                ...prev,
                [filter.field]: data
              })))
              .catch(err => console.error('Error fetching options:', err));
          }
        });
      }
    }
  }, [templates, selectedTemplate, user?.token]);

  useEffect(() => {
    if (selectedTemplate && user?.token) {
      dispatch(getReportPreview({
        code: selectedTemplate,
        params: {
          filters,
          language
        }
      }));
    }
  }, [selectedTemplate, filters, language, dispatch, user?.token]);

  const handleTemplateChange = (event) => {
    const value = event.target.value;
    setSelectedTemplate(value);
    setFilters({});
    if (value) {
      dispatch(getReportPreview({
        code: value,
        params: { language }
      })).unwrap()
        .catch((error) => {
          enqueueSnackbar('Error loading report preview', { variant: 'error' });
        });
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenerateReport = () => {
    try {
      dispatch(generateReport({
        code: selectedTemplate,
        params: {
          filters,
          format: exportFormat,
          language
        }
      })).unwrap()
        .then(() => {
          enqueueSnackbar('Report generated successfully', { variant: 'success' });
        });
    } catch (error) {
      console.error('Error generating report:', error);
      enqueueSnackbar('Error generating report', { variant: 'error' });
    }
  };

  const renderFilterInput = (filter) => {
    switch (filter.type) {
      case 'date':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label={`Start ${filter.label.en}`}
                value={filters[`${filter.field}Start`] || ''}
                onChange={(e) => handleFilterChange(`${filter.field}Start`, e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  endAdornment: filters[`${filter.field}Start`] && (
                    <IconButton
                      size="small"
                      onClick={() => handleFilterChange(`${filter.field}Start`, '')}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={`End ${filter.label.en}`}
                type="date"
                value={filters[`${filter.field}End`] || ''}
                onChange={(e) => handleFilterChange(`${filter.field}End`, e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  endAdornment: filters[`${filter.field}End`] && (
                    <IconButton
                      size="small"
                      onClick={() => handleFilterChange(`${filter.field}End`, '')}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  ),
                  inputProps: {
                    min: filters[`${filter.field}Start`] || undefined
                  }
                }}
              />
            </Grid>
          </Grid>
        );
      case 'select':
        const options = filter.optionsUrl
          ? (filterOptions[filter.field] || [])
          : (filter.options || []);

        return (
          <FormControl fullWidth>
            <InputLabel>{filter.label.en}</InputLabel>
            <Select
              value={filters[filter.field] || ''}
              onChange={(e) => handleFilterChange(filter.field, e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {options.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label?.en || option.value}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      default:
        return null;
    }
  };

  const formatValue = (value, column) => {
    if (value === null || value === undefined) return '-';

    if (typeof value === 'boolean') return value ? 'Yes' : 'No';

    if (value instanceof Date || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/))) {
      return new Date(value).toLocaleDateString();
    }

    if (typeof value === 'number') {
      if (Number.isInteger(value)) return value.toString();
      return value.toFixed(2);
    }

    if (typeof value === 'string') {
      if (column === 'description') return value.substring(0, 30) + '...';
      if (value.length > 100) return value.substring(0, 100) + '...';
      return value;
    }

    return JSON.stringify(value);
  };

  const getStatusColor = (status) => {
    const statusColors = {
      active: 'success',
      completed: 'success',
      in_progress: 'warning',
      pending: 'warning',
      cancelled: 'error',
      inactive: 'error',
      high: 'error',
      medium: 'warning',
      low: 'info'
    };
    return statusColors[status] || 'default';
  };

  const renderPreviewTable = (data) => {
    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0]).filter(column => column !== 'description');

    return (
      <TableContainer>
        <Table stickyHeader={false} size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column}
                  sx={{
                    fontWeight: 'bold',
                    textTransform: 'capitalize',
                    whiteSpace: 'nowrap',
                    backgroundColor: 'background.paper'
                  }}
                >
                  {column.replace(/([A-Z])/g, ' $1').replace(/([a-z])([A-Z])/g, '$1 $2')}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index} hover>
                {columns.map((column) => (
                  <TableCell
                    key={column}
                    sx={{
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {['status', 'priority'].includes(column) ? (
                      <Chip
                        label={formatValue(row[column], column)}
                        size="small"
                        color={getStatusColor(row[column])}
                        variant="outlined"
                      />
                    ) : (
                      formatValue(row[column], column)
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
        Reports & Analytics
      </Typography>

      <Grid container spacing={3}>
        {/* Report Configuration */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Report Configuration
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Report Template</InputLabel>
                  <Select
                    value={selectedTemplate}
                    onChange={handleTemplateChange}
                    disabled={isLoading}
                    label="Report Template"
                  >
                    <MenuItem value="">
                      <em>Select a template</em>
                    </MenuItem>
                    {templates?.map(template => (
                      <MenuItem key={template.code} value={template.code}>
                        {template.name?.en || template.code || 'Unnamed Template'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Report Language</InputLabel>
                  <Select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="si">සිංහල</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Export Format</InputLabel>
                  <Select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                  >
                    <MenuItem value="pdf">PDF</MenuItem>
                    <MenuItem value="excel">Excel</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {selectedTemplate && templates.find(t => t.code === selectedTemplate)?.filters.map(filter => (
              <Box key={filter.field} sx={{ mb: 3 }}>
                {renderFilterInput(filter)}
              </Box>
            ))}

            <Button
              fullWidth
              variant="contained"
              onClick={handleGenerateReport}
              disabled={isLoading || !selectedTemplate}
              startIcon={isLoading ? <CircularProgress size={20} /> : <FileDownloadIcon />}
            >
              Generate Report
            </Button>
          </Paper>
        </Grid>

        {/* Report Preview */}
        {selectedTemplate && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Preview
              </Typography>

              {isError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  Error generating preview: {message}
                </Alert>
              )}

              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : previewData ? (
                <Box>
                  {previewData.isPartial && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Showing first 10 records. Generate the full report to see all data.
                    </Alert>
                  )}
                  {renderPreviewTable(previewData.data)}
                </Box>
              ) : (
                <Alert severity="info">
                  Select a template and configure filters to see preview
                </Alert>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Reports;