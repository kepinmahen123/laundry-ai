import React, {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import HomeNav from './HomeNav';
import AuthStack from './AuthStack';
import {keepLoginAction} from '../redux/action';

const Main = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(keepLoginAction());
  }, [dispatch]);
  const {isSignedIn} = useSelector((state) => state.auth);
  return <>{isSignedIn ? <HomeNav /> : <AuthStack />}</>;
};

export default Main;
