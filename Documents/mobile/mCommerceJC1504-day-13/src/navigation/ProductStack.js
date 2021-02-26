import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import FeedScreen from '../screen/product/FeedScreen';
import DetailScreen from '../screen/product/DetailScreen';

const Stack = createStackNavigator();

const ProductStack = () => {
  return (
    <Stack.Navigator headerMode="none" initialRouteName="ProductList">
      <Stack.Screen name="ProductList" component={FeedScreen} />
      <Stack.Screen name="Detail" component={DetailScreen} />
    </Stack.Navigator>
  );
};

export default ProductStack;
