import React from 'react';
import {StyleSheet, View, Image, Pressable} from 'react-native';
import {Text} from 'native-base';
import {local} from '../../localip';
import {primary_color} from '../screen/styles';
import {Button, Icon} from 'react-native-elements';

const CartCard = ({
  id,
  name,
  image,
  price,
  navigation,
  quantity,
  changeQtyButton,
  deleteCartButton,
}) => {
  return (
    <View style={styles.cardStyle}>
      <View style={styles.imageContainer}>
        <Image source={{uri: `${local}${image}`}} style={styles.imageStyle} />
      </View>
      <View style={styles.infoContainer}>
        <View>
          <Text style={styles.titleStyle}>{name}</Text>
        </View>
        <View>
          <Text style={styles.priceStyle}>Rp. {price.toLocaleString()}</Text>
        </View>
        <View style={styles.actionContainer}>
          <View style={styles.qtyContainer}>
            <Button
              title="-"
              onPress={() => changeQtyButton({quantity: quantity - 1, id})}
              buttonStyle={styles.qtyButton}
            />
            <Text style={styles.qtyText}>{quantity}</Text>
            <Button
              title="+"
              onPress={() => changeQtyButton({quantity: quantity + 1, id})}
              buttonStyle={styles.qtyButton}
            />
          </View>
          <View style={styles.iconContainer}>
            <Pressable onPress={() => deleteCartButton(id)}>
              <Icon name="delete" type="material" color={primary_color} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardStyle: {
    flex: 1,
    height: 225,
    flexDirection: 'row',
    backgroundColor: 'white',
    marginVertical: 10,
    borderRadius: 14,
  },
  imageContainer: {
    flex: 1,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-evenly',
  },
  titleStyle: {
    fontSize: 25,
    color: 'black',
    fontWeight: 'bold',
  },
  priceStyle: {
    fontSize: 20,
  },
  imageStyle: {
    flex: 1,
    width: null,
    height: null,
    resizeMode: 'contain',
  },
  buyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginRight: 10,
  },
  buttonStyle: {
    backgroundColor: primary_color,
    borderRadius: 14,
  },
  qtyContainer: {
    flexDirection: 'row',
    // justifyContent: 'flex-end',
    alignItems: 'center',
    // marginRight: 10,
    // marginVertical: 10,
  },
  qtyButton: {
    backgroundColor: primary_color,
    height: 40,
    width: 40,
  },
  qtyText: {
    fontSize: 18,
    marginHorizontal: 10,
    // color: text_color,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 10,
  },
});

export default CartCard;
