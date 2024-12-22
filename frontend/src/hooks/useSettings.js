import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { getSettings } from '../features/settings/settingsSlice';

export const useSettings = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getSettings());
  }, [dispatch]);
}; 