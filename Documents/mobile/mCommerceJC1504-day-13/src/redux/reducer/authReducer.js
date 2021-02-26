import {
  AUTH_FAILED,
  AUTH_LOGOUT,
  AUTH_START,
  AUTH_SUCCESS,
  NULLIFY_ERROR,
} from '../types';

const INITIAL_STATE = {
  id: 0,
  username: '',
  email: '',
  roleID: 0,
  isSignedIn: false,
  loading: false,
  error: false,
  errorMessage: '',
};

// action.payload = {
//     id: 1,
//     username: 'lianeddy',
//     email: 'lian.eddy@gmail.com',
//     roleID: 2
// }

export const authReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case AUTH_START:
      return {
        ...state,
        loading: true,
      };
    case AUTH_SUCCESS:
      return {
        ...action.payload,
        isSignedIn: true,
        loading: false,
      };
    case AUTH_FAILED:
      return {
        ...state,
        loading: false,
        error: true,
        errorMessage: action.payload,
      };
    case NULLIFY_ERROR:
      return {
        ...state,
        error: false,
        errorMessage: '',
      };
    case AUTH_LOGOUT:
      return INITIAL_STATE;
    default:
      return state;
  }
};
