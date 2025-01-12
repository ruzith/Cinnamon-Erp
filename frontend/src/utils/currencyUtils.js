import { useSelector } from 'react-redux';
import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setCurrencies } from '../features/currencies/currencySlice';
import axios from 'axios';

// Create a hook to access currency settings
export const useCurrencyFormatter = () => {
  const dispatch = useDispatch();
  const { settings, isLoading: settingsLoading } = useSelector(state => state.settings);
  const currencies = useSelector(state => state.currencies || []);
  const { user } = useSelector(state => state.auth);

  // Modify effect to check for user authentication
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await axios.get('/api/currencies');
        dispatch(setCurrencies(response.data));
      } catch (error) {
        console.error('Error fetching currencies:', error);
      }
    };

    // Only fetch if user is logged in and currencies are empty
    if (user && (!currencies || currencies.length === 0)) {
      fetchCurrencies();
    }
  }, [dispatch, currencies.length, user]);

  const formatCurrency = useCallback((amount) => {
    // If settings are still loading or not available, use default values
    const defaultCurrency = (!settingsLoading && settings && currencies.length > 0)
      ? currencies.find(c => c.id === settings.default_currency)
      : null;

    const currencyInfo = defaultCurrency || {
      code: 'LKR',
      symbol: 'Rs.',
      rate: 1
    };

    // Format the full amount with thousands separators
    const formattedAmount = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);

    // Return the formatted amount with the appropriate currency symbol
    return `${currencyInfo.symbol} ${formattedAmount}`;
  }, [currencies, settings, settingsLoading]);

  const convertToBaseCurrency = useCallback((amount, fromCurrencyId) => {
    const fromCurrency = currencies.find(c => c.id === fromCurrencyId) || { rate: 1 };
    return amount / fromCurrency.rate;
  }, [currencies]);

  const convertFromBaseCurrency = useCallback((amount, toCurrencyId) => {
    const toCurrency = currencies.find(c => c.id === toCurrencyId) || { rate: 1 };
    return amount * toCurrency.rate;
  }, [currencies]);

  return { formatCurrency, convertToBaseCurrency, convertFromBaseCurrency };
};

// For non-component usage, create a simpler formatter
export const formatCurrencyStatic = (amount) => {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
  return `Rs. ${formattedAmount}`;
};