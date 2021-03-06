/* global cozy cordova */
import React, { Component } from 'react'
import {
  temporarySave,
  getNativeFile,
  openFileWithCordova
} from 'drive/mobile/lib/filesystem'
import NoViewer from './NoViewer'
import Spinner from 'cozy-ui/react/Spinner'
import classNames from 'classnames'
import { translate } from 'cozy-ui/react/I18n'

import styles from './styles'

const VIEWER_OPTIONS = {
  email: {
    enabled: true
  },
  print: {
    enabled: true
  },
  openWith: {
    enabled: false
  },
  bookmarks: {
    enabled: true
  },
  search: {
    enabled: false
  },
  autoClose: {
    onPause: false
  }
}

class NativePdfViewer extends Component {
  state = {
    opening: true,
    error: null
  }

  nativeFileUrl = null

  onOpen = () => {
    this.setState({ opening: false })
  }

  onClose = () => {
    this.props.onClose()
  }

  onError = e => {
    console.warn(e)
    this.setState({ error: e })
  }

  componentWillMount = async () => {
    try {
      if (this.props.file.isAvailableOffline) {
        const file = await getNativeFile(this.props.file)
        this.nativeFileUrl = file.nativeURL
      } else {
        const response = await cozy.client.files.downloadById(
          this.props.file.id
        )
        const blob = await response.blob()
        const file = await temporarySave(blob, this.props.file.name)
        this.nativeFileUrl = file.nativeURL
      }

      this.openPdfInExternalViewer()
    } catch (e) {
      this.onError(e)
    }
  }

  openPdfInExternalViewer = () => {
    const { t } = this.props

    cordova.plugins.SitewaertsDocumentViewer.viewDocument(
      this.nativeFileUrl,
      'application/pdf',
      {
        ...VIEWER_OPTIONS,
        documentView: {
          closeLabel: t('Viewer.close')
        },
        navigationView: {
          closeLabel: t('Viewer.close')
        },
        title: this.props.file.name
      },
      this.onOpen,
      this.onClose,
      this.openPdfWithSystem,
      this.onError
    )
  }

  openPdfWithSystem = async () => {
    try {
      document.addEventListener('resume', this.onSystemPdfViewerExit, false)
      await openFileWithCordova(this.nativeFileUrl, 'application/pdf')
      this.onOpen()
    } catch (e) {
      this.onError(e)
    }
  }

  onSystemPdfViewerExit = () => {
    document.removeEventListener('resume', this.onSystemPdfViewerExit)
    this.onClose()
  }

  componentWillUnmount() {
    document.removeEventListener('resume', this.onSystemPdfViewerExit)
  }

  render() {
    const { file } = this.props
    const { opening, error } = this.state

    if (opening && !error)
      return <Spinner size="xxlarge" middle="true" noMargin color="white" />
    else if (error) return <NoViewer file={file} />
    else
      return (
        <div
          className={classNames(
            styles['pho-viewer-noviewer'],
            styles[`pho-viewer-noviewer--${file.class}`]
          )}
        >
          <p className={styles['pho-viewer-filename']}>{file.name}</p>
        </div>
      )
  }
}

export default translate()(NativePdfViewer)
