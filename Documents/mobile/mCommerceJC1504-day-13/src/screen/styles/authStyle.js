import {StyleSheet} from 'react-native';
import {background_color, primary_color, surface_color, text_color} from '.';

export default StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: background_color,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    margin: 10,
  },
  buttonStyle: {
    backgroundColor: primary_color,
    borderRadius: 20,
    marginVertical: 5,
  },
  inputStyle: {
    backgroundColor: surface_color,
    color: text_color,
    marginVertical: 5,
    borderColor: 'transparent',
  },
  itemStyle: {
    borderColor: 'transparent',
  },
  buttonTextColor: {
    color: text_color,
  },
});
