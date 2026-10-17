import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './apiSlice';

export const apiStore = configureStore({
  reducer: { [apiSlice.reducerPath]: apiSlice.reducer },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }).concat(apiSlice.middleware),
});
