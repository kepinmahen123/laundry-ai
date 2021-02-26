import {Button, Input, Item, Text} from 'native-base';
import React, {useState} from 'react';
import {View} from 'react-native';
import {Icon} from 'react-native-elements';
import {useDispatch, useSelector} from 'react-redux';
import {primary_color} from '../styles';
import styles from '../styles/authStyle';
import {AuthModal} from '../../components';
import {loginAction} from '../../redux/action';

const LoginScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const {loading} = useSelector((state) => state.auth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  return (
    <View style={styles.mainContainer}>
      <AuthModal />
      <View style={styles.logoContainer}>
        <Icon name="polymer" type="material" color={primary_color} size={150} />
      </View>
      <View style={styles.inputContainer}>
        <View>
          <Item style={styles.itemStyle}>
            <Input
              placeholder="Username"
              onChangeText={(e) => setUsername(e)}
              style={styles.inputStyle}
              placeholderTextColor="gray"
            />
          </Item>
          <Item style={styles.itemStyle}>
            <Input
              placeholder="Password"
              onChangeText={(e) => setPassword(e)}
              secureTextEntry
              style={styles.inputStyle}
              placeholderTextColor="gray"
            />
          </Item>
        </View>
        <View>
          <Button
            disabled={loading}
            full
            onPress={() => dispatch(loginAction({username, password}))}
            style={styles.buttonStyle}>
            <Text style={styles.buttonTextColor}>LOGIN</Text>
          </Button>
          <Button
            disabled={loading}
            full
            onPress={() => navigation.replace('Register')}
            style={styles.buttonStyle}>
            <Text style={styles.buttonTextColor}>REGISTER</Text>
          </Button>
        </View>
      </View>
    </View>
  );
};

export default LoginScreen;
