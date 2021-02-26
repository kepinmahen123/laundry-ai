import axios from 'axios';
import {local} from '../../../localip';
import {FETCH_FAILED, FETCH_START, FETCH_SUCCESS} from '../types';

const url = `${local}/product`;

export const fetchProductAction = ({search}) => {
  return async (dispatch) => {
    try {
      dispatch({type: FETCH_START});
      const response = await axios.get(`${url}?name=${search}`);
      dispatch({type: FETCH_SUCCESS, payload: response.data});
    } catch (err) {
      dispatch({type: FETCH_FAILED, payload: err.response.data.error});
    }
  };
};
