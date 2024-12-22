import { createSlice } from '@reduxjs/toolkit';

const initialState = [];

const currencySlice = createSlice({
  name: 'currencies',
  initialState,
  reducers: {
    setCurrencies: (state, action) => {
      return action.payload;
    },
  },
});

export const { setCurrencies } = currencySlice.actions;
export default currencySlice.reducer; 