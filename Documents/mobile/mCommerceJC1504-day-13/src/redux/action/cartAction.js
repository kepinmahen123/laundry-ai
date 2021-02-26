import axios from 'axios';
import {local} from '../../../localip';
import {CART_FAILED, CART_START, CART_SUCCESS} from '../types';

const url = `${local}/cart`;

export const addToCartAction = ({productID, userID, quantity}) => {
  return async (dispatch) => {
    try {
      dispatch({type: CART_START});
      await axios.post(`${url}/${userID}`, {productID, quantity});
      dispatch(fetchCartAction(userID));
    } catch (err) {
      dispatch({type: CART_FAILED, payload: err.response.data.error});
    }
  };
};

export const fetchCartAction = (id) => {
  return async (dispatch) => {
    try {
      dispatch({type: CART_START});
      const response = await axios.get(`${url}/${id}`);
      dispatch({type: CART_SUCCESS, payload: response.data});
    } catch (err) {
      dispatch({type: CART_FAILED, payload: err.response.data.error});
    }
  };
};

export const changeQtyCartAction = ({quantity, id, userID}) => {
  return async (dispatch) => {
    try {
      dispatch({type: CART_START});
      await axios.patch(`${url}/${id}`, {quantity});
      dispatch(fetchCartAction(userID));
    } catch (err) {
      dispatch({type: CART_FAILED, payload: err.response.data.error});
    }
  };
};

export const deleteCartAction = ({userID, id}) => {
  return async (dispatch) => {
    try {
      dispatch({type: CART_START});
      await axios.delete(`${url}/${id}`);
      dispatch(fetchCartAction(userID));
    } catch (err) {
      dispatch({type: CART_FAILED, payload: err.response.data.error});
    }
  };
};
