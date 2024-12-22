import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrencies } from '../features/currencies/currencySlice';
import axios from 'axios';

export const useCurrencies = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await axios.get('/api/currencies');
        dispatch(setCurrencies(response.data));
      } catch (error) {
        console.error('Error fetching currencies:', error);
      }
    };

    if (user) {
      fetchCurrencies();
    }
  }, [dispatch, user]);
}; 