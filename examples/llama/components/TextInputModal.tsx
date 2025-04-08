import React from 'react';

import {
  View,
  Text,
  Modal,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

const InputPrompt = ({
  value,
  onChangeText,
  modalVisible,
  setModalVisible,
}: {
  value: string;
  onChangeText: (_: string) => void;
  modalVisible: boolean;
  setModalVisible: (_: boolean) => void;
}) => {
  return (
    <View style={styles.centeredView}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <TouchableOpacity
          style={styles.centeredView}
          activeOpacity={1}
          onPressOut={() => {
            setModalVisible(false);
          }}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <TextInput
                placeholder="Enter audio url"
                style={styles.textInputStyle}
                onChangeText={(text) => onChangeText(text)}
                value={value}
              />
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => setModalVisible(!modalVisible)}
              >
                <Text style={styles.confirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  confirmText: {
    fontSize: 20,
    color: 'white',
    fontWeight: '400',
  },
  confirmButton: {
    backgroundColor: '#001A72',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: 40,
    borderRadius: 40,
    paddingRight: 15,
    paddingLeft: 15,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
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
  textInputStyle: {
    textAlign: 'center',
    height: 40,
    width: 200,
    marginBottom: 20,
    borderRadius: 20,
    borderWidth: 1,
    padding: 10,
    borderColor: '#ccc',
  },
});

export default InputPrompt;
