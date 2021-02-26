import {
  FETCH_FAILED,
  FETCH_START,
  FETCH_SUCCESS,
  NULLIFY_ERROR,
} from '../types';

const INITIAL_STATE = {
  productList: [],
  loading: false,
  error: false,
  message: '',
};

export const productReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case FETCH_START:
      return {
        ...state,
        loading: true,
      };
    case FETCH_SUCCESS:
      return {
        ...state,
        productList: action.payload,
        loading: false,
      };
    case FETCH_FAILED:
      return {
        ...state,
        error: true,
        message: action.payload,
        loading: false,
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
