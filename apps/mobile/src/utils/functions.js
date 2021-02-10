import {history} from '.';
import {updateEvent} from '../components/DialogManager/recievers';
import {Actions} from '../provider/Actions';
import {eSendEvent, ToastEvent} from '../services/EventManager';
import {db} from './DB';
import {eClearEditor, eOnNewTopicAdded, refreshNotesPage} from './Events';
import {Linking} from 'react-native';
import {InAppBrowser} from 'react-native-inappbrowser-reborn';

export const deleteItems = async (item) => {
  if (item && item.id && history.selectedItemsList.length === 0) {
    history.selectedItemsList = [];
    history.selectedItemsList.push(item);
  }

  let notes = history.selectedItemsList.filter((i) => i.type === 'note');
  let notebooks = history.selectedItemsList.filter(
    (i) => i.type === 'notebook',
  );
  let topics = history.selectedItemsList.filter((i) => i.type === 'topic');

  if (notes?.length > 0) {
    let ids = notes.map((i) => i.id);
    await db.notes.delete(...ids);
    updateEvent({type: Actions.NOTES});
    eSendEvent(eClearEditor);
    eSendEvent(refreshNotesPage);
  }
  if (topics?.length > 0) {
    for (var i = 0; i < topics.length; i++) {
      let it = topics[i];
      await db.notebooks.notebook(it.notebookId).topics.delete(it.id);
    }
    updateEvent({type: Actions.NOTEBOOKS});
    updateEvent({type: Actions.MENU_PINS});
    eSendEvent(eOnNewTopicAdded);
    ToastEvent.show('Topics deleted', 'success');
  }

  if (notebooks?.length > 0) {
    let ids = notebooks.map((i) => i.id);
    await db.notebooks.delete(...ids);
    updateEvent({type: Actions.NOTEBOOKS});
    updateEvent({type: Actions.NOTES});
    updateEvent({type: Actions.MENU_PINS});
  }

  let msgPart = history.selectedItemsList.length === 1 ? ' item' : ' items';
  let message = history.selectedItemsList.length + msgPart + ' moved to trash.';

  let itemsCopy = [...history.selectedItemsList];
  if (topics.length === 0 && (notes.length > 0 || notebooks.length > 0)) {
    ToastEvent.show(
      message,
      'error',
      'global',
      6000,
      async () => {
        let trash = db.trash;
        let ids = [];
        for (var i = 0; i < itemsCopy.length; i++) {
          let it = itemsCopy[i];
          let trashItem = trash.all.find((item) => item.itemId === it.id);
          ids.push(trashItem.id);
        }
        await db.trash.restore(...ids);
        updateEvent({type: Actions.NOTEBOOKS});
        updateEvent({type: Actions.NOTES});
        updateEvent({type: Actions.TRASH});
        updateEvent({type: Actions.COLORS});
        updateEvent({type: Actions.MENU_PINS});
        ToastEvent.hide();
      },
      'Undo',
    );
  }
  updateEvent({type: Actions.TRASH});
  updateEvent({type: Actions.CLEAR_SELECTION});
  updateEvent({type: Actions.COLORS});
  updateEvent({type: Actions.SELECTION_MODE, enabled: false});
};


export const openLinkInBrowser = async (link, colors) => {
  try {
    const url = link;
    if (await InAppBrowser.isAvailable()) {
      await InAppBrowser.open(url, {
        // iOS Properties
        dismissButtonStyle: 'cancel',
        preferredBarTintColor: colors.accent,
        preferredControlTintColor: 'white',
        readerMode: false,
        animated: true,
        modalPresentationStyle: 'fullScreen',
        modalTransitionStyle: 'coverVertical',
        modalEnabled: true,
        enableBarCollapsing: false,
        // Android Properties
        showTitle: true,
        toolbarColor: colors.accent,
        secondaryToolbarColor: 'black',
        enableUrlBarHiding: true,
        enableDefaultShare: true,
        forceCloseOnRedirection: false,
       
      });
    } else Linking.openURL(url);
  } catch (error) {
    console.log(error.message);
  }
}
