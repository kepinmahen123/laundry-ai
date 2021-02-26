import React from 'react';
import {Text, View} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Icon} from 'react-native-elements';
import {background_color, primary_color} from '../screen/styles';
import ProductStack from './ProductStack';
import {useSelector} from 'react-redux';
import CartScreen from '../screen/cart/CartScreen';

const Tab = createBottomTabNavigator();

const Post = () => {
  return (
    <View>
      <Text>Post</Text>
    </View>
  );
};

const HomeNav = () => {
  const length = useSelector((state) => state.cart.cartList.length);
  return (
    <Tab.Navigator
      tabBarOptions={{
        activeTintColor: primary_color,
        inactiveTintColor: 'gray',
      }}
      initialRouteName="Feed"
      sceneContainerStyle={{backgroundColor: background_color}}
      screenOptions={({route}) => ({
        tabBarIcon: ({color}) => {
          let iconName;
          if (route.name === 'Feed') {
            iconName = 'shopping-bag';
          } else if (route.name === 'Post') {
            iconName = 'ac-unit';
          } else if (route.name === 'Cart') {
            iconName = 'shopping-cart';
          }
          return <Icon name={iconName} type="material" color={color} />;
        },
      })}>
      <Tab.Screen name="Feed" component={ProductStack} />
      <Tab.Screen name="Post" component={Post} />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{tabBarBadge: length}}
      />
    </Tab.Navigator>
  );
};

export default HomeNav;
