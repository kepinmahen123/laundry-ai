import React, {useEffect, useState} from 'react';
import {FlatList} from 'react-native';
import {SearchBar} from 'react-native-elements';
import {useDispatch, useSelector} from 'react-redux';
import {CardProduct} from '../../components';
import {fetchProductAction} from '../../redux/action';

const FeedScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const [search, setSearch] = useState('');
  useEffect(() => {
    dispatch(fetchProductAction({search}));
  }, [dispatch, search]);

  const {productList} = useSelector((state) => state.product);
  return (
    <FlatList
      ListHeaderComponent={
        <SearchBar
          placeholder="Search..."
          value={search}
          onChangeText={(e) => setSearch(e)}
        />
      }
      keyExtractor={(item) => item.id.toString()}
      data={productList}
      numColumns={1}
      renderItem={({item}) => (
        <CardProduct
          id={item.id}
          name={item.name}
          image={item.image[0].imagepath}
          price={item.price}
          description={item.description}
          navigation={navigation}
        />
      )}
    />
  );
};

export default FeedScreen;
