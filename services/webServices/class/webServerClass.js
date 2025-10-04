const http = require('http');
const express = require('express');
const mime = require('mime-types');
//const { securityAdministrator } = require('../../securityServer/securityAdministrator');
//const {PathSetUp}= require('../controler/pathSetUp')

class WebServer {
    constructor(port) {
        this.port = port;
        this.app = express();
        this.server = http.createServer(this.app);
        this.publicPath = require('path').resolve(__dirname, '../../public');
       // this.pathSetUp= new PathSetUp(); 

        this.app.use(express.static(this.publicPath, {
            setHeaders: (res, filePath) => {
                const mimeType = mime.lookup(filePath);
                if (mimeType) {
                    res.setHeader('Content-Type', mimeType);
                }
            }
        }));
        
    }

    /* _userAuthentication() {
        securityAdministrator.userAuthentication(this.app);
    }
    _tokenAuthentication(){
       // securityAdministrator.tokenAutehntication(this.app);
    }
    _setupRoutes(app,express,publicPath,securityAdministrator){
    this.pathSetUp.setRoutes(app,express,publicPath,securityAdministrator);
        
    } */

    start() {
        /* this._userAuthentication();
        this._tokenAuthentication();
        this._setupRoutes(this.app,express,this.publicPath,securityAdministrator); */
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}`);
        });
    }

}

module.exports = WebServer; 