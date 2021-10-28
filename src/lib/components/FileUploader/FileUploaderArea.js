// This file is part of React-Invenio-Deposit
// Copyright (C) 2020 CERN.
// Copyright (C) 2020 Northwestern University.
// Copyright (C) 2021 Graz University of Technology.
//
// React-Invenio-Deposit is free software; you can redistribute it and/or modify it
// under the terms of the MIT License; see LICENSE file for more details.
import { useFormikContext } from 'formik';
import _get from 'lodash/get';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Dropzone from 'react-dropzone';
import {
  Button,
  Grid,
  Header,
  Segment,
  Icon,
  Progress,
  Table,
  Popup,
  Checkbox,
  Dropdown
} from 'semantic-ui-react';
import OwnCloudModal from './OwnCloud/OwnCloudModal';
import { i18next } from '@translations/i18next';
import { humanReadableBytes } from './utils';

const FileTableHeader = ({ isDraftRecord }) => (
  <Table.Header>
    <Table.Row className="file-table-row">
      <Table.HeaderCell className="file-table-header-cell">
        {i18next.t('Preview')}{' '}
        <Popup
          content="Set the default preview"
          trigger={<Icon fitted name="help circle" size="small" />}
        />
      </Table.HeaderCell>
      <Table.HeaderCell className="file-table-header-cell">
        {i18next.t('Filename')}
      </Table.HeaderCell>
      <Table.HeaderCell className="file-table-header-cell">
        {i18next.t('Size')}
      </Table.HeaderCell>
      {isDraftRecord && (
        <Table.HeaderCell textAlign="center" className="file-table-header-cell">
          {i18next.t('Progress')}
        </Table.HeaderCell>
      )}
      {isDraftRecord && <Table.HeaderCell className="file-table-header-cell" />}
    </Table.Row>
  </Table.Header>
);

const FileTableRow = ({
  isDraftRecord,
  file,
  deleteFileFromRecord,
  defaultPreview,
  setDefaultPreview,
}) => {
  const isDefaultPreview = defaultPreview === file.name;

  const handleDelete = (file) => {
    deleteFileFromRecord(file).then(() => {
      if (isDefaultPreview) {
        setDefaultPreview('');
      }
    });
  };

  return (
    <Table.Row key={file.name} className="file-table-row">
      <Table.Cell className="file-table-cell" width={2}>
        {/* TODO: Investigate if react-deposit-forms optimized Checkbox field
                  would be more performant */}
        <Checkbox
          checked={isDefaultPreview}
          onChange={() => setDefaultPreview(isDefaultPreview ? '' : file.name)}
        />
      </Table.Cell>
      <Table.Cell className="file-table-cell" width={10}>
        {file.upload.pending ? (
          file.name
        ) : (
          <a
            href={_get(file, 'links.content', '')}
            target="_blank"
            rel="noopener noreferrer"
          >
            {file.name}
          </a>
        )}
        <br />
        {file.checksum && (
          <div className="ui text-muted">
            <span style={{ fontSize: '10px' }}>{file.checksum}</span>{' '}
            <Popup
              content={i18next.t(
                'This is the file fingerprint (MD5 checksum), which can be used to verify the file integrity.'
              )}
              trigger={<Icon fitted name="help circle" size="small" />}
              position="top center"
            />
          </div>
        )}
      </Table.Cell>
      <Table.Cell className="file-table-cell" width={2}>
        {file.size ? humanReadableBytes(file.size) : ''}
      </Table.Cell>
      {isDraftRecord && (
        <Table.Cell className="file-table-cell file-upload-pending" width={2}>
          {!file.upload?.pending && (
            <Progress
              className="file-upload-progress"
              percent={file.upload.progress}
              error={file.upload.failed}
              size="medium"
              color="blue"
              progress
              autoSuccess
              active={!file.upload.initial}
              disabled={file.upload.initial}
            />
          )}
          {file.upload?.pending && <span>{i18next.t('Pending')}</span>}
        </Table.Cell>
      )}
      {isDraftRecord && (
        <Table.Cell textAlign="right" width={2} className="file-table-cell">
          {file.upload && !(file.upload.ongoing || file.upload.initial) && (
            <Icon
              link
              className="action"
              name="trash alternate outline"
              color="blue"
              onClick={() => handleDelete(file)}
            />
          )}
          {file.upload && file.upload.ongoing && (
            <Button
              compact
              type="button"
              negative
              size="tiny"
              onClick={() => file.upload.cancel()}
            >
              {i18next.t('Cancel')}
            </Button>
          )}
        </Table.Cell>
      )}
    </Table.Row>
  );
};

export class SelectUpload extends Component {
  constructor(props){
    super(props);
    this.state = {
      open: this.setCloudOpenStates()
    }
  }

  setCloudOpenStates = () => {
    let cloudIntegrations = this.props.cloudIntegrations.enabled;
    let openStates = {};
    cloudIntegrations.forEach(integration => {
      openStates[integration] = false;
    })
    return openStates;
  }

  closeModal = (item) => {
    let open = this.state.open;
    open[item] = false;
    this.setState({open})
  }

  openCloudModal = (event, item) => {
    console.log("Selected:", event, item);

    let open = this.state.open;
    open[item.value] = true;
    this.setState({open});
  }

  getOptionText(option){
    switch(option) {
      case 'cernbox':
        return 'CERNBox';
      default:
        return 'Undefined';
    }
  }
  getCloudOptions = () => {
    let cloudIntegrations = this.props.cloudIntegrations.enabled;

    return cloudIntegrations
            .map(option => {
              return {
                key: option,
                text: this.getOptionText(option),
                value: option,
                onClick: this.openCloudModal
              }
            })
  }

  render() {
    let cloudFileParams = this.props.cloudIntegrations.cloudFileParams;
    let cloudOptions = this.getCloudOptions();
    return(
    <>
      <Dropdown placeholder='Upload files from...' 
                selection 
                options={[
                  { 
                    key: 'local', 
                    value: 'local', 
                    text: 'My computer', 
                    onClick: this.props.openFileDialog
                  },
                  ...cloudOptions
                ]}
      />
      <OwnCloudModal open={this.state.open['cernbox']} 
                    close={() => this.closeModal('cernbox')} 
                    {...cloudFileParams}
      />
    </>);
  }
}

const FileUploadBox = ({
  isDraftRecord,
  filesList,
  dragText,
  uploadButtonIcon,
  uploadButtonText,
  openFileDialog,
  cloudIntegrations
}) => {

  let cloudEnabled = cloudIntegrations.enabled && cloudIntegrations.enabled.length;
  console.log("CloudEnabled:", cloudEnabled);

  return isDraftRecord && (
    <div>
    <Segment
      basic
      padded="very"
      className={
        filesList.length ? 'file-upload-area' : 'file-upload-area no-files'
      }
    >
      <Grid columns={3} textAlign="center">
        <Grid.Row verticalAlign="middle">
          <Grid.Column width="7">
            <Header size="small">{dragText}</Header>
          </Grid.Column>
          <Grid.Column width="2">
            - {i18next.t('or')} -
          </Grid.Column>
          <Grid.Column width="7">
            {cloudEnabled ?
              <SelectUpload cloudIntegrations={cloudIntegrations}
                            openFileDialog={openFileDialog}
              /> 
              : 
              <Button
                type="button"
                primary={true}
                icon={uploadButtonIcon}
                content={uploadButtonText}
                onClick={() => openFileDialog()}
                disabled={openFileDialog === null}
              />
            }
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Segment>
  </div>
  )};

const FilesListTable = ({ isDraftRecord, filesList, deleteFileFromRecord }) => {
  const { setFieldValue, values: formikDraft } = useFormikContext();
  const defaultPreview = _get(formikDraft, 'files.default_preview', '');
  return (
    <Table>
      <FileTableHeader isDraftRecord={isDraftRecord} />
      <Table.Body>
        {filesList.map((file) => {
          return (
            <FileTableRow
              key={file.name}
              isDraftRecord={isDraftRecord}
              file={file}
              deleteFileFromRecord={deleteFileFromRecord}
              defaultPreview={defaultPreview}
              setDefaultPreview={(filename) =>
                setFieldValue('files.default_preview', filename)
              }
            />
          );
        })}
      </Table.Body>
    </Table>
  );
};

export class FileUploaderArea extends Component {

  render() {
    const { filesEnabled, cloudIntegrations, dropzoneParams, cloudFileParams,
            filesList, isDraftRecord} = this.props;

    return filesEnabled ? (
      <Grid>
        {filesList.length !== 0 && (
          <Grid.Row>
            <Grid.Column verticalAlign="middle">
              <FilesListTable {...this.props} />
            </Grid.Column>
          </Grid.Row>
        )}
        <Grid.Row>
          <Grid.Column width={16}>
            <Dropzone {...dropzoneParams}>
              {({ getRootProps, getInputProps, open: openFileDialog }) => (
                
                  <span {...getRootProps()}>
                    <input {...getInputProps()} />
                    <FileUploadBox {...this.props} 
                      openFileDialog={openFileDialog}
                      cloudIntegrations={cloudIntegrations}
                      cloudFileParams={cloudFileParams} 
                    />
                  </span>
                
              )}
            </Dropzone>
          </Grid.Column>
          {/* {isDraftRecord && cloudEnabled &&
            <Grid.Column width={6}>
                  <Header size="small">Upload files from</Header>
                  { cloudIntegrations.cernBox &&
                  <OwnCloudModal {...cernBoxParams} />
                  }
            </Grid.Column>
          } */}
        </Grid.Row>
      </Grid>
    ) : (
      <Grid.Column width={16}>
        <Segment basic padded="very" className="file-upload-area no-files">
          <Grid textAlign="center">
            <Grid.Row verticalAlign="middle">
              <Grid.Column>
                <Header size="medium">
                  {i18next.t('This is a Metadata only record')}
                </Header>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Segment>
      </Grid.Column>
    );
  }
}

FileUploaderArea.propTypes = {
  defaultFilePreview: PropTypes.string,
  deleteFileFromRecord: PropTypes.func,
  dragText: PropTypes.string,
  dropzoneParams: PropTypes.object,
  cernBoxParams: PropTypes.object,
  filesEnabled: PropTypes.bool,
  filesList: PropTypes.array,
  isDraftRecord: PropTypes.bool,
  links: PropTypes.object,
  setDefaultPreviewFile: PropTypes.func,
  uploadButtonIcon: PropTypes.string,
  uploadButtonText: PropTypes.string,
  cloudIntegrations: PropTypes.object
};
