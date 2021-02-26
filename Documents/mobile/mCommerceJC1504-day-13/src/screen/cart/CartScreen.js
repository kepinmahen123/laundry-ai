import {Text} from 'native-base';
import React from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import {Button} from 'react-native-elements';
import {useSelector, useDispatch} from 'react-redux';
import {CartCard} from '../../components';
import {changeQtyCartAction, deleteCartAction} from '../../redux/action';
import {primary_color} from '../styles';

const CartScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const {cartList} = useSelector((state) => state.cart);
  const userID = useSelector((state) => state.auth.id);

  const changeQtyButton = ({quantity, id}) => {
    //   {quantity, userID, id}
    dispatch(changeQtyCartAction({quantity, id, userID}));
  };

  const deleteCartButton = (id) => {
    dispatch(deleteCartAction({userID, id}));
  };

  const renderTotalPrice = () => {
    let total = 0;
    cartList.forEach((val) => (total += val.price * val.quantity));
    return total.toLocaleString();
  };
  return (
    <View style={styles.mainContainer}>
      <FlatList
        keyExtractor={(item) => item.id.toString()}
        data={cartList}
        renderItem={({item}) => (
          <CartCard
            name={item.name}
            id={item.id}
            image={item.image[0].imagepath}
            price={item.price}
            navigation={navigation}
            quantity={item.quantity}
            changeQtyButton={changeQtyButton}
            deleteCartButton={deleteCartButton}
          />
        )}
      />
      <View style={styles.totalContainer}>
        <Text style={styles.textStyles}>Rp. {renderTotalPrice()}</Text>
        <Button title="Check Out" buttonStyle={styles.buttonStyles} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'white',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  buttonStyles: {
    backgroundColor: primary_color,
  },
  textStyles: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default CartScreen;
