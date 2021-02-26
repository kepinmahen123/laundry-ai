import {Button, Input, Item} from 'native-base';
import React, {useState} from 'react';
import {Text, View} from 'react-native';
import {Icon} from 'react-native-elements';
import {useDispatch, useSelector} from 'react-redux';
import {AuthModal} from '../../components';
import {registerAction} from '../../redux/action';
import {AUTH_FAILED} from '../../redux/types';
import {primary_color} from '../styles';
import styles from '../styles/authStyle';

const RegisterScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const {loading} = useSelector((state) => state.auth);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  return (
    <View style={styles.mainContainer}>
      <AuthModal />
      <View style={styles.logoContainer}>
        <Icon name="polymer" type="material" color={primary_color} size={150} />
      </View>
      <View style={styles.inputContainer}>
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
            placeholder="Email"
            onChangeText={(e) => setEmail(e)}
            style={styles.inputStyle}
            placeholderTextColor="gray"
          />
        </Item>
        <Item style={styles.itemStyle}>
          <Input
            placeholder="Password"
            onChangeText={(e) => setPassword(e)}
            style={styles.inputStyle}
            placeholderTextColor="gray"
            secureTextEntry
          />
        </Item>
        <Item style={styles.itemStyle}>
          <Input
            placeholder="Confirm Password"
            onChangeText={(e) => setConfirm(e)}
            style={styles.inputStyle}
            placeholderTextColor="gray"
            secureTextEntry
          />
        </Item>
        <Button
          disabled={loading}
          full
          onPress={
            password === confirm
              ? () => dispatch(registerAction({username, email, password}))
              : () => dispatch({type: AUTH_FAILED, payload: 'Password Invalid'})
          }
          style={styles.buttonStyle}>
          <Text style={styles.buttonTextColor}>REGISTER</Text>
        </Button>
        <Button
          disabled={loading}
          full
          onPress={() => navigation.replace('Login')}
          style={styles.buttonStyle}>
          <Text style={styles.buttonTextColor}>LOGIN</Text>
        </Button>
      </View>
    </View>
  );
};

export default RegisterScreen;
