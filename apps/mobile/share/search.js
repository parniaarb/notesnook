import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {getElevation} from '../src/utils';
import {db} from '../src/utils/database';
import {useShareStore} from './store';

export const Search = ({close, getKeyboardHeight}) => {
  const colors = useShareStore(state => state.colors);
  const setAppendNote = useShareStore(state => state.setAppendNote);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchKeyword = useRef(null);
  const {width, height} = useWindowDimensions();
  const notes = useRef(null);
  const timer = useRef(null);
  const inputRef = useRef();

  const onSelectItem = async item => {
    setAppendNote(item);
    close();
  };

  const onSearch = async () => {
    if (!notes.current) {
      await db.init();
      await db.notes.init();
      notes.current = db.notes.all;
    }
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    timer.current = setTimeout(async () => {
      if (!searchKeyword.current) return;
      setSearching(true);
      setResults(await db.lookup.notes(notes.current, searchKeyword.current));
      setSearching(false);
    }, 500);
  };

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
  }, []);

  const renderItem = ({item, index}) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onSelectItem(item)}
      style={{
        height: 50,
        paddingHorizontal: 12
      }}>
      <Text
        numberOfLines={1}
        style={{
          color: colors.pri,
          fontFamily: 'OpenSans-SemiBold',
          fontSize: 15
        }}>
        {item.title}
      </Text>

      <Text
        numberOfLines={1}
        style={{
          color: colors.icon,
          fontSize: 12,
          fontFamily: 'OpenSans-Regular'
        }}>
        {item.headline}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View
      style={{
        position: 'absolute',
        top: 20,
        backgroundColor: colors.bg,
        borderRadius: 10,
        width: '95%',
        minHeight: 50,
        alignSelf: 'center',
        zIndex: 999,
        ...getElevation(5)
      }}>
      <View
        style={{
          flexShrink: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 12,
          marginBottom: 10
        }}>
        <TextInput
          ref={inputRef}
          placeholder="Search for a note"
          style={{
            fontSize: 15,
            fontFamily: 'OpenSans-Regular',
            width: '85%'
          }}
          onChangeText={value => {
            searchKeyword.current = value;
            onSearch();
          }}
          onSubmitEditing={onSearch}
        />
        {searching ? (
          <ActivityIndicator size={25} color={colors.icon} />
        ) : (
          <Icon
            name="magnify"
            color={colors.pri}
            size={25}
            onPress={onSearch}
          />
        )}
      </View>

      <FlatList
        data={results}
        style={{
          maxHeight: height - getKeyboardHeight()
        }}
		keyboardShouldPersistTaps="always"
		keyboardDismissMode="none"
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              height: 200
            }}>
            <Text
              style={{
                fontFamily: 'OpenSans-Regular'
              }}>
              Search for a note to append to it.
            </Text>
          </View>
        }
      />
    </View>
  );
};
