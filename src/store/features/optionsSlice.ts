import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface OptionsState {
  selectedOptions: Record<string, string>; 
  selectedCustomizations: Record<string, Record<string, string>>;
}

const initialState: OptionsState = {
  selectedOptions: {},
  selectedCustomizations: {},
};

const optionsSlice = createSlice({
  name: 'options',
  initialState,
  reducers: {
    setSelectedOption: (state, action: PayloadAction<{productId: string, option: string}>) => {
      state.selectedOptions[action.payload.productId] = action.payload.option;
    },
    setSelectedCustomization: (state, action: PayloadAction<{productId: string, group: string, option: string}>) => {
      if (!state.selectedCustomizations[action.payload.productId]) {
        state.selectedCustomizations[action.payload.productId] = {};
      }
      state.selectedCustomizations[action.payload.productId][action.payload.group] = action.payload.option;
    },
    // resetSelectedOption: (state, action: PayloadAction<{productId: string}>) => {
    //   delete state.selectedOptions[action.payload.productId];
    // }
  },
});

export const { setSelectedOption, setSelectedCustomization } = optionsSlice.actions;
export default optionsSlice.reducer;