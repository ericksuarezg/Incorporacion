const http = require('http');
const express = require('express');
const mime = require('mime-types');
const cors = require('cors');
const { connectMongo, mongoose } = require('../../server/conection/mongo');
const authRoutes = require('../../auth/authRoutes');
const { securityAdministrator } = require('../../securityServer/securityAdministrator');
const userRoutes = require('../../user/userRoutes');
const hojaVidaRoutes = require('../../hojaVida/hojaVidaRoutes');

class WebServer {
    constructor(port) {
        this.port = port;
        this.app = express();
        this.server = http.createServer(this.app);
        this.publicPath = require('path').resolve(__dirname, '../../public');
        // this.pathSetUp= new PathSetUp();

        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            if (req.method === 'OPTIONS') {
                return res.sendStatus(204);
            }
            next();
        });

        this.app.use(express.json());

        this.app.use(express.static(this.publicPath, {
            setHeaders: (res, filePath) => {
                const mimeType = mime.lookup(filePath);
                if (mimeType) {
                    res.setHeader('Content-Type', mimeType);
                }
            }
        }));

        // Endpoint de salud para comprobar la conexión a MongoDB
        this.app.get('/api/health/db', (req, res) => {
            const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
            res.json({
                readyState: mongoose.connection.readyState,
                state: states[mongoose.connection.readyState]
            });
        });

        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/users', userRoutes);
        this.app.use('/api/hojas-vida', hojaVidaRoutes); // <-- nueva ruta para hojas de vida
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

    async start() {
        console.log('[webserver] MONGODB_URI:', process.env.MONGODB_URI);
        securityAdministrator.userAuthentication(this.app);
        await connectMongo();

        /* this._userAuthentication();
        this._tokenAuthentication();
        this._setupRoutes(this.app,express,this.publicPath,securityAdministrator); */
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}`);
        });
    }

}

module.exports = WebServer;