import React from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Grid,
  Typography
} from '@mui/material';

const Form = ({
  title,
  fields,
  values,
  onChange,
  onSubmit,
  submitLabel = 'Submit',
  loading = false
}) => {
  const renderField = (field) => {
    const { name, label, type = 'text', options, required = false } = field;

    if (type === 'select') {
      return (
        <FormControl fullWidth required={required}>
          <InputLabel>{label}</InputLabel>
          <Select
            name={name}
            value={values[name] || ''}
            onChange={onChange}
            label={label}
          >
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    return (
      <TextField
        fullWidth
        name={name}
        label={label}
        type={type}
        value={values[name] || ''}
        onChange={onChange}
        required={required}
      />
    );
  };

  return (
    <Box component="form" onSubmit={onSubmit} noValidate>
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}
      <Grid container spacing={2}>
        {fields.map((field) => (
          <Grid item xs={12} sm={field.width || 6} key={field.name}>
            {renderField(field)}
          </Grid>
        ))}
        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            fullWidth
          >
            {submitLabel}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Form; 