import React from 'react';
import { Modal, Button, Icon } from 'semantic-ui-react';

export default class FilePickerModal extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            open: false,
            iframeLoaded: false,
            token: null
        }

        this.iframeRef = React.createRef();
    }

    openModal = () => {
        this.setState({open: true})
    }

    closeModal= () => {
        this.setState({open: false})
    }

    componentDidUpdate() {
        let iframe = this.iframeRef.current;
        iframe && iframe.addEventListener("load", () => {
            this.setState({ iframeLoaded: true });
            console.log("Loaded iframe");

            let content = iframe.contentDocument;

            let filepicker = content.getElementById('filePicker');

            filepicker.addEventListener('upload', event => {
                console.log("#2 Upload event:", event);
                let files = event.detail;
                this.props.onLoad(files);
                this.props.close();
            });
    
            filepicker.addEventListener('cancel', () => this.props.close());
          });
    }

    render(){
        console.log("OwnCloudModal open:", this.props.open);
        return <Modal open={this.props.open}
                      onClose={this.props.close}
                      closeIcon
                >
                  <Modal.Content>
                        {this.state.iframeLoaded ? '': <span>Loading...</span>}
                        <iframe ref={this.iframeRef} 
                                src="/owncloud/file-picker"
                                width="100%" 
                                height="500" 
                                style={{border: 'none'}} 
                        />
                  </Modal.Content>
              </Modal>
    }
}
