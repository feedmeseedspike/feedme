import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface OptionsState {
  selectedOptions: Record<string, string>; 
}

const initialState: OptionsState = {
  selectedOptions: {},
};

const optionsSlice = createSlice({
  name: 'options',
  initialState,
  reducers: {
    setSelectedOption: (state, action: PayloadAction<{productId: string, option: string}>) => {
      state.selectedOptions[action.payload.productId] = action.payload.option;
    },
    // resetSelectedOption: (state, action: PayloadAction<{productId: string}>) => {
    //   delete state.selectedOptions[action.payload.productId];
    // }
  },
});

export const { setSelectedOption } = optionsSlice.actions;
export default optionsSlice.reducer;