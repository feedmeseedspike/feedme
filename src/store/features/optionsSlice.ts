import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface OptionsState {
  selectedOption: string | null
}

const initialState: OptionsState = {
  selectedOption: null,
}

const optionsSlice = createSlice({
  name: 'options',
  initialState,
  reducers: {
    setSelectedOption: (state, action: PayloadAction<string>) => {
      state.selectedOption = action.payload
    },
  },
})

export const { setSelectedOption } = optionsSlice.actions
export default optionsSlice.reducer
