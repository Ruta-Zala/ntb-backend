require('dotenv').config()

const express = require('express');
const cors = require('cors')
const axios = require('axios')
const utils = require('./utils'); 

var corsAllow = ['https://networkingtoolbox.cisco.com', 'http://localhost:3000',]

var corsOptionsDelegate = function (req, callback) {
  var corsOptions;
  if (corsAllow.indexOf(req.header('Origin')) !== -1) {
    corsOptions = { origin: true } 
  } else {
    corsOptions = { origin: false }
  }
  callback(null, corsOptions)
}

const app = express();
app.use(express.json());
app.set('port', process.env.PORT || 30001);
app.use(cors(corsOptionsDelegate))

app.use(async function (req, res, next) {
  let proceed = false
  try {
    let reqHeadersCopy = JSON.parse(JSON.stringify(req.headers));
    let incomingJwtToken
    if (reqHeadersCopy.hasOwnProperty("authorization")) {
      incomingJwtToken = await utils.getJWT(req)
    }
    if(incomingJwtToken !== null && incomingJwtToken !== undefined){
        //front-end request. Validate against Universal Auth API
        try {
          let headers = {"Authorization":"Bearer " + incomingJwtToken}     
          const response = await axios({
            method: 'get',
            url:  'https://auth-validate.wbx.ninja/cortex/validate', //todo update this with new URL after NT UA is in place
            headers: headers
          })
          if(response.status === 200){
            proceed = true
          }       
        } catch (e) {
          if(e.response.data.statusCode === 401){
            res.sendStatus(401)
            proceed = false
          }       
        }
    } else {
      if(!proceed){
        if (!res.headersSent) {
          res.sendStatus(401)
        }
      }
    }
  } catch (e) {
    console.log('failed to get info from jwt:', e.message)
    if (!res.headersSent) {
      res.sendStatus(401)
    }
  } 
  // continue processing
  if(proceed){
    next()
  } else {
    if (!res.headersSent) {
      res.sendStatus(401)
    }
  }
})

/* Routes */
app.use('/api/v1/user', require('./routes/user'))
app.use('/api/v1/users', require('./routes/users'))
app.use('/api/v1/usersSearchByEmail', require('./routes/usersSearchByEmail'))

app.use(function (req, res, next) {
  res.status(404).send("Route not found!")
})


/* Listen for incoming http requests */
const server = app.listen(app.get('port'), () => {
})
server.keepAliveTimeout = 60000