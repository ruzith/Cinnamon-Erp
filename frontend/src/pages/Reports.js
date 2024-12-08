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
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { getReportTemplates, generateReport } from '../features/reports/reportSlice';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

const Reports = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { templates = [], currentReport = null, isLoading = false, isError = false, message = '' } = useSelector(state => state.reports || {});
  
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [filters, setFilters] = useState({});
  const [language, setLanguage] = useState('en');
  const [exportFormat, setExportFormat] = useState('json');

  useEffect(() => {
    if (!templates || templates.length === 0) {
      console.log('No templates available:', templates);
    } else {
      console.log('Templates loaded:', templates);
    }
  }, [templates]);

  useEffect(() => {
    if (user?.token) {
      dispatch(getReportTemplates());
    }
  }, [dispatch, user]);

  const handleTemplateChange = (event) => {
    setSelectedTemplate(event.target.value);
    setFilters({});
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenerateReport = () => {
    dispatch(generateReport({
      code: selectedTemplate,
      params: {
        filters,
        format: exportFormat,
        language
      }
    }));
  };

  const renderFilterInput = (filter) => {
    switch (filter.type) {
      case 'date':
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label={filter.label[language]}
              onChange={(date) => handleFilterChange(filter.field, date)}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        );
      
      case 'select':
        return (
          <FormControl fullWidth>
            <InputLabel>{filter.label[language]}</InputLabel>
            <Select
              value={filters[filter.field] || ''}
              onChange={(e) => handleFilterChange(filter.field, e.target.value)}
            >
              {filter.options?.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label[language]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      
      default:
        return (
          <TextField
            fullWidth
            label={filter.label[language]}
            value={filters[filter.field] || ''}
            onChange={(e) => handleFilterChange(filter.field, e.target.value)}
          />
        );
    }
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
                  >
                    {isLoading ? (
                      <MenuItem disabled>Loading templates...</MenuItem>
                    ) : templates && templates.length > 0 ? (
                      templates.map(template => (
                        <MenuItem key={template.code} value={template.code}>
                          {template.name?.[language] || template.code || 'Unnamed Template'}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>
                        {isError ? message || 'Error loading templates' : 'No templates available'}
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Language</InputLabel>
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
                    <MenuItem value="json">JSON</MenuItem>
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
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : <FileDownloadIcon />}
            >
              Generate Report
            </Button>
          </Paper>
        </Grid>

        {/* Report Preview */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, minHeight: 400 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Report Preview
            </Typography>

            {isError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                Error generating report. Please try again.
              </Alert>
            )}

            {currentReport && (
              <Box>
                {/* Render report data based on template and format */}
                {/* This would be customized based on your needs */}
                <pre>{JSON.stringify(currentReport, null, 2)}</pre>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports; 