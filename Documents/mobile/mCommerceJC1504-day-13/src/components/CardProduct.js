import React from 'react';
import {StyleSheet, View, Image} from 'react-native';
import {Button, Text} from 'native-base';
import {local} from '../../localip';
import {primary_color} from '../screen/styles';

const CardProduct = ({id, name, image, price, description, navigation}) => {
  return (
    <View style={styles.cardStyle}>
      <View style={styles.imageContainer}>
        <Image source={{uri: `${local}${image}`}} style={styles.imageStyle} />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.titleStyle}>{name}</Text>
        <Text>{description}</Text>
        <View style={styles.buyContainer}>
          <Text style={styles.priceStyle}>Rp. {price.toLocaleString()}</Text>
          <Button
            style={styles.buttonStyle}
            onPress={() => navigation.navigate('Detail', {id})}>
            <Text>BUY</Text>
          </Button>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardStyle: {
    flex: 1,
    height: 300,
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
    fontSize: 18,
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
});

export default CardProduct;
