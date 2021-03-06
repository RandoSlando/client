// @flow
import logger from '../../logger'
import * as Saga from '../../util/saga'
import * as Flow from '../../util/flow'
import * as FsGen from '../fs-gen'
import {type TypedState} from '../../util/container'
import RNFetchBlob from 'rn-fetch-blob'
import {copy, unlink} from '../../util/file'
import {PermissionsAndroid} from 'react-native'
import {pickAndUploadToPromise} from './common.native'
import {saveAttachmentDialog, showShareActionSheetFromURL} from '../platform-specific'

function copyToDownloadDir(path: string, mimeType: string) {
  const fileName = path.substring(path.lastIndexOf('/') + 1)
  const downloadPath = `${RNFetchBlob.fs.dirs.DownloadDir}/${fileName}`
  return PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE, {
    message: 'Keybase needs access to your storage so we can download a file to it',
    title: 'Keybase Storage Permission',
  })
    .then(permissionStatus => {
      if (permissionStatus !== 'granted') {
        throw new Error('Unable to acquire storage permissions')
      }
      return copy(path, downloadPath)
    })
    .then(() => unlink(path))
    .then(() =>
      RNFetchBlob.android.addCompleteDownload({
        description: `Keybase downloaded ${fileName}`,
        mime: mimeType,
        path: downloadPath,
        showNotification: true,
        title: fileName,
      })
    )
    .catch(err => {
      console.log('Error completing download')
      console.log(err)
      throw err
    })
}

const downloadSuccessToAction = (state: TypedState, action: FsGen.DownloadSuccessPayload) => {
  const {key, mimeType} = action.payload
  const download = state.fs.downloads.get(key)
  if (!download) {
    logger.warn('missing download key', key)
    return null
  }
  const {intent, localPath} = download.meta
  switch (intent) {
    case 'camera-roll':
      return Saga.sequentially([
        Saga.callUntyped(saveAttachmentDialog, localPath),
        Saga.put(FsGen.createDismissDownload({key})),
      ])
    case 'share':
      return Saga.sequentially([
        Saga.callUntyped(showShareActionSheetFromURL, {mimeType, url: localPath}),
        Saga.put(FsGen.createDismissDownload({key})),
      ])
    case 'none':
      return Saga.sequentially([
        Saga.callUntyped(copyToDownloadDir, localPath, mimeType),
        // TODO: dismiss download when we get rid of download cards on mobile
      ])
    default:
      Flow.ifFlowComplainsAboutThisFunctionYouHaventHandledAllCasesInASwitch(intent)
      return null
  }
}

function* platformSpecificSaga(): Saga.SagaGenerator<any, any> {
  yield Saga.actionToPromise(FsGen.pickAndUpload, pickAndUploadToPromise)
  yield Saga.actionToAction(FsGen.downloadSuccess, downloadSuccessToAction)
}

export default platformSpecificSaga
