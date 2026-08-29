import {createSlice} from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {token: null, fcmToken: null, user: null},
  reducers: {
    restoreSession: (state, action) => ({...state, ...action.payload}),
    loginSucceeded: (state, action) => ({...state, ...action.payload}),
    logout: () => ({token: null, fcmToken: null, user: null}),
  },
});
export const {restoreSession, loginSucceeded, logout} = authSlice.actions;
export default authSlice.reducer;
