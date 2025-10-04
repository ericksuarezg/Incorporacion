const jwt= require('jsonwebtoken');
class SecurityAdministrator {

    constructor() {

    } 

    userAuthentication(app) {
        console.log('autenticando el usuario')
        app.use(async (req, res, next) => {
            console.log(`Tipo de peticion: ${req.method}`)
            console.log(`URL solicitada: ${req.url}`)
            next()
        })
    }
    

    tokenAutehntication=(req, res, next)=> { 
        const token = req.headers.authorization;
      
        if (!token) {
          return res.status(401).json({ message: 'Token no proporcionado' });
        }
      
        jwt.verify(token.split(' ')[1], 'secretKey', (err, decodedToken) => {
          if (err) {
            return res.status(401).json({ message: 'Token inválido' });
          }
          req.userId = decodedToken.userId;
          next();
        });
      }
    
   
    
}

let securityAdministrator= new SecurityAdministrator();
module.exports = { securityAdministrator }