import React, {useState} from 'react';
import {Image, Text, View, ScrollView, StyleSheet} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import Swiper from 'react-native-web-swiper';
import {local} from '../../../localip';
import {Button} from 'react-native-elements';
import {
  background_color,
  primary_color,
  surface_color,
  text_color,
} from '../styles';
import {addToCartAction, changeQtyCartAction} from '../../redux/action';

const sizes = ['s', 'm', 'l', 'xl'];
const colors = ['merah', 'biru', 'hijau'];

const DetailScreen = ({navigation, route}) => {
  const dispatch = useDispatch();
  const [quantity, setQuantity] = useState(1);
  const {productList} = useSelector((state) => state.product);
  const userID = useSelector((state) => state.auth.id);
  const {cartList} = useSelector((state) => state.cart);
  const {name, price, description, category, image} = productList.find(
    (val) => val.id === route.params.id,
  );

  const buyBtn = () => {
    const productInCart = cartList.find((val) => val.name === name);
    if (productInCart) {
      dispatch(
        changeQtyCartAction({
          quantity: productInCart.quantity + quantity,
          id: productInCart.id,
          userID,
        }),
      );
    } else {
      dispatch(addToCartAction({productID: route.params.id, quantity, userID}));
    }
    return navigation.goBack();
  };

  return (
    // <ScrollView>
    <View style={styles.container}>
      <View style={styles.swiperContainer}>
        <Swiper>
          {image.map((val) => {
            return (
              <Image
                key={val.id}
                source={{uri: `${local}${val.imagepath}`}}
                style={styles.imageStyle}
              />
            );
          })}
        </Swiper>
      </View>
      <View style={styles.contentContainer}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Text style={styles.titleStyle}>{name}</Text>
          <Text style={styles.priceStyle}>Rp.{price.toLocaleString()}</Text>
        </View>

        <Text style={{color: text_color}}>{category}</Text>
        <View style={{marginVertical: 20}}>
          <Text style={{fontWeight: 'bold', color: text_color}}>
            Description
          </Text>
          <Text style={{color: text_color}}>{description}</Text>
        </View>
        {/* <View>{category === "Clothing" || "Electronic" ? }</View> */}

        <View style={styles.qtyContainer}>
          <Button
            title="-"
            onPress={() => setQuantity((prev) => prev - 1)}
            buttonStyle={styles.qtyButton}
            disabled={quantity === 1}
          />
          <Text style={styles.qtyText}>{quantity}</Text>
          <Button
            title="+"
            onPress={() => setQuantity((prev) => prev + 1)}
            buttonStyle={styles.qtyButton}
          />
        </View>
      </View>
      {/* idProduct, userID, quantity */}
      <Button title="Buy" buttonStyle={styles.buttonStyle} onPress={buyBtn} />
    </View>

    // </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  swiperContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  imageStyle: {
    flex: 1,
    resizeMode: 'contain',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: surface_color,
    // justifyContent: 'space-around',
    paddingHorizontal: 10,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingTop: 10,
  },
  titleStyle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: text_color,
  },
  priceStyle: {
    fontSize: 18,
    color: text_color,
  },
  qtyContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  buttonStyle: {
    backgroundColor: primary_color,
  },
  qtyButton: {
    backgroundColor: primary_color,
    height: 40,
    width: 40,
  },
  qtyText: {
    fontSize: 18,
    marginHorizontal: 10,
    color: text_color,
  },
});

export default DetailScreen;
