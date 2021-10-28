import React from 'react';
const $script = require('scriptjs');

export default class FilePickerComponent extends React.Component {
    constructor(props) {
        super(props)

        this.filePickerRef = React.createRef()
        this.configObject = {
            server: "https://localhost:9200",
            openIdConnect : {
              metadata_url: "https://localhost:9200/.well-known/openid-configuration",
              authority: "https://localhost:9200",
              client_id: "filepicker",
              response_type: "code",
              scope: "openid profile email"
            }
        }

        this.state = {
            FilePicker: null
        }
        this.getComponent = this.getComponent.bind(this);
        this.getComponent();

    }

    getComponent(){
        $script('https://unpkg.com/vue@2.6.14/dist/vue.js', async () => {
            await import('@ownclouders/file-picker/dist/wc/file-picker.min.js');
            let FilePicker = <file-picker ref={this.filePickerRef}
                                          config-object={JSON.stringify(this.configObject)}
                                          id="file-picker"
                                          variation="resource"
                                          cancel-btn-label="Cancel"
                             >
                             </file-picker>

            this.setState({ FilePicker })
                
        })
    }

    handleFileURL = (fileUrl) => {
        this.props.onLoad(fileUrl)
    }

    componentDidUpdate(){
        if(this.state.FilePicker) {
            this.filePickerRef.current.addEventListener('select', event => {
                let path = event.detail[0][0].path
                let token = window.sessionStorage.getItem(`oc_oAuthuser:${this.configObject.server}:filepicker`)
                token = JSON.parse(token)
                token = token.access_token

                fetch(`https://localhost:9200/remote.php/webdav${path}`, {
                        headers: {
                            'Access-Control-Allow-Origin': '*',
                            'Authorization': `Bearer ${token}`
                        }
                    })
                    .then(response => {
                        console.log("Response:", response)
                        this.handleFileURL(response.data)
                    })
                    .catch(error => {
                        console.log("Error:", error)
                    })
            })
            this.filePickerRef.current.addEventListener('update', event => {
                console.log("Updated:", event)
            })
        }
    }

    render(){
        return <div>{ this.state.FilePicker || 'nope'}</div>
    }
}