import React from 'react';
import {Alert, Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {dismissErrorAction} from '../redux/action';
import {primary_color, surface_color, text_color} from '../screen/styles';

const AuthModal = () => {
  const dispatch = useDispatch();
  const {error, errorMessage} = useSelector((state) => state.auth);
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={error}
      onRequestClose={() => {
        Alert.alert('Modal has been closed.');
        //   setModalVisible(!modalVisible);
      }}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>{errorMessage}</Text>
          <Pressable
            style={[styles.button, styles.buttonClose]}
            onPress={() => dispatch(dismissErrorAction())}>
            <Text style={styles.textStyle}>Ok</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: surface_color,
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: '#F194FF',
  },
  buttonClose: {
    backgroundColor: primary_color,
  },
  textStyle: {
    color: text_color,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    color: text_color,
  },
});

export default AuthModal;
