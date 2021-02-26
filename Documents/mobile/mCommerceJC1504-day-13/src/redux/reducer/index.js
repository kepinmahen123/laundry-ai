import {combineReducers} from '@reduxjs/toolkit';
import {authReducer} from './authReducer';
import {productReducer} from './productReducer';
import {cartReducer} from './cartReducer';

export default combineReducers({
  auth: authReducer,
  product: productReducer,
  cart: cartReducer,
});
