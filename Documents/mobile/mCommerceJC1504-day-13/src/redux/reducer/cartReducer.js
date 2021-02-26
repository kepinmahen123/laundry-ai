import {CART_FAILED, CART_START, CART_SUCCESS, NULLIFY_ERROR} from '../types';

const INITIAL_STATE = {
  cartList: [],
  loading: false,
  error: false,
  message: '',
};

export const cartReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case CART_START:
      return {
        ...state,
        loading: true,
      };
    case CART_SUCCESS:
      return {
        ...state,
        loading: false,
        cartList: action.payload,
      };
    case CART_FAILED:
      return {
        ...state,
        loading: false,
        error: true,
        message: action.payload,
      };
    case NULLIFY_ERROR:
      return {
        ...state,
        error: false,
        message: '',
      };
    default:
      return state;
  }
};
