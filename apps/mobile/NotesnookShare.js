import React, {Component, createRef} from 'react';
import {
  ActivityIndicator,
  Appearance,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {ScrollView, TextInput} from 'react-native-gesture-handler';
import ShareExtension from 'rn-extensions-share';
import validator from 'validator';
import {COLOR_SCHEME_DARK, COLOR_SCHEME_LIGHT} from './src/utils/Colors';
import {db} from './src/utils/DB';
import Storage from './src/utils/storage';
import {sleep} from './src/utils/TimeUtils';

export default class NotesnookShare extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      isOpen: true,
      text: '',
      title: '',
      loading: false,
      colors:
        Appearance.getColorScheme() === 'dark'
          ? COLOR_SCHEME_DARK
          : COLOR_SCHEME_LIGHT,
      height: 0,
    };

    this.textInputRef = createRef();
    this.titleInputRef = createRef();
  }

  async componentDidMount() {
    try {
      const data = await ShareExtension.data();
      let text;
      data.forEach((item) => {
        if (item.type === 'text') {
          text = item.value + '\n\n';
        }
      });
      this.setState({
        text: text,
      });
    } catch (e) {
      console.log('errrr', e);
    }
  }

  close = () => {
    this.setState({
      text: null,
    });
    ShareExtension.close();
  };

  onPress = async () => {
    this.titleInputRef.current?.blur();
    this.textInputRef.current?.blur();
    this.setState({
      loading: true,
    });

    let tag = validator.isURL(this.state.text) ? 'a' : 'p';
    let add = async () => {
      await db.notes.add({
        title: this.state.title,
        content: {
          type:'tiny',
          data:`<${tag}>${this.state.text}<${tag}/>`
        },
        id: null,
      });
    };
    if (db && db.notes) {
      await add();
    } else {
      await db.init();
      await add();
    }
    await Storage.write('notesAddedFromIntent', 'added');
    await sleep(500);
    this.close();
  };

  saveBtn = () => (
    <View
      style={{
        paddingHorizontal: 12,
      }}>
      <TouchableOpacity
        onPress={this.onPress}
        activeOpacity={0.8}
        style={{
          backgroundColor: this.state.colors.accent,
          width: '100%',
          height: 50,
          borderRadius: 5,
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
        }}>
        {this.state.loading && (
          <ActivityIndicator color={this.state.colors.light} />
        )}

        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: this.state.colors.light,
            marginLeft: this.state.loading ? 10 : 0,
          }}>
          Save Note
        </Text>
      </TouchableOpacity>
    </View>
  );

  render() {
    return Platform.OS === 'ios' ? (
      <View
        style={{
          width: '100%',
          height: '100%',
          justifyContent: 'flex-end',
        }}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            ShareExtension.close();
          }}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
          }}>
          <View
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0,0,0,0.01)',
            }}
          />
        </TouchableOpacity>

        <KeyboardAvoidingView
          enabled={Platform.OS === 'ios'}
          style={{
            paddingVertical: 25,
            backgroundColor: this.state.colors.bg,
            borderTopRightRadius: 10,
            borderTopLeftRadius: 10,
          }}
          behavior="padding">
          <View
            style={{
              maxHeight: '100%',
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderBottomWidth: 1,
                borderBottomColor: this.state.colors.nav,
                paddingHorizontal: 12,
                justifyContent: 'space-between',
              }}>
              <TextInput
                ref={this.titleInputRef}
                style={{
                  fontSize: 25,
                  fontWeight: 'bold',
                  color: this.state.colors.pri,
                  flexGrow: 1,
                  maxWidth: '85%',
                }}
                placeholderTextColor={this.state.colors.icon}
                value={this.state.title}
                onChangeText={(v) => this.setState({title: v})}
                onSubmitEditing={() => {
                  this.textInputRef.current?.focus();
                }}
                blurOnSubmit={false}
                placeholder="Note Title"
              />

              <TouchableOpacity
                onPress={this.close}
                activeOpacity={0.8}
                style={{
                  width: 50,
                  height: 40,
                  borderRadius: 5,
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'row',
                }}>
                <Text
                  style={{
                    fontSize: 14,
                    color: this.state.colors.accent,
                    marginLeft: this.state.loading ? 10 : 0,
                  }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              ref={this.textInputRef}
              style={{
                fontSize: 15,
                color: this.state.colors.pri,
                marginBottom: 10,
                width: '100%',
                maxHeight: '70%',
                paddingVertical: 10,
                paddingHorizontal: 12,
              }}
              placeholderTextColor={this.state.colors.icon}
              onChangeText={(v) => this.setState({text: v})}
              multiline={true}
              value={this.state.text}
              blurOnSubmit={false}
              placeholder="Type your note here"
            />
            {this.saveBtn()}
            <View
              style={{
                height: 25,
              }}
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    ) : (
      <Modal visible transparent>
        <View
          onLayout={(event) => {
            console.log(event.nativeEvent.layout.height);
            this.setState({
              height: event.nativeEvent.layout.height,
            });
          }}
          style={{
            justifyContent: 'flex-end',
            width: '100%',
            height: '100%',
          }}>
          <TouchableOpacity
            activeOpacity={0}
            onPress={() => {
              ShareExtension.close();
            }}
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
            }}
          />
          <View
            style={{
              paddingVertical: 25,
              backgroundColor: this.state.colors.bg,
              borderTopRightRadius: 10,
              borderTopLeftRadius: 10,
              width: '100%',
              paddingTop: 15,
            }}>
            <ScrollView
              style={{
                maxHeight: this.state.height * 0.8,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderBottomWidth: 1,
                  borderBottomColor: this.state.colors.nav,
                  paddingHorizontal: 12,
                  justifyContent: 'space-between',
                }}>
                <TextInput
                  ref={this.titleInputRef}
                  style={{
                    fontSize: 25,
                    fontWeight: 'bold',
                    color: this.state.colors.pri,
                    flexGrow: 1,
                    maxWidth: '85%',
                  }}
                  placeholderTextColor={this.state.colors.icon}
                  value={this.state.title}
                  onChangeText={(v) => this.setState({title: v})}
                  onSubmitEditing={() => {
                    this.textInputRef.current?.focus();
                  }}
                  blurOnSubmit={false}
                  placeholder="Note Title"
                />

                <TouchableOpacity
                  onPress={this.close}
                  activeOpacity={0.8}
                  style={{
                    width: 70,
                    height: 40,
                    borderRadius: 5,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'row',
                  }}>
                  <Text
                    style={{
                      fontSize: 14,
                      color: this.state.colors.accent,
                      marginLeft: this.state.loading ? 10 : 0,
                    }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                ref={this.textInputRef}
                style={{
                  fontSize: 15,
                  color: this.state.colors.pri,
                  paddingTop: 0,
                  marginBottom: 10,
                  paddingHorizontal: 12,
                }}
                placeholderTextColor={this.state.colors.icon}
                onChangeText={(v) => this.setState({text: v})}
                multiline={true}
                value={this.state.text}
                placeholder="Type your note here"
              />
            </ScrollView>

            {this.saveBtn()}
          </View>
        </View>
      </Modal>
    );
  }
}
