const express = require('express')
const router = express.Router()
const model = require('../models/users')
const utils = require('../utils')

// find one user by email
router.get('/:email', async (req, res) => {
  try {
    const query = {
      email: req.params.email
    }
    const results = await model.findOne(query)
    if (results) {
      //only return results if this is the logged in user  
      //NOTE: don't move this up before the query. See below. 
      const jwt = utils.getUsersJwt(req);
      const isUser = jwt.email === req.params.email
      if(isUser){
        return res.status(200).send(results)
      } else {
        let message = 'You do not have access to this resource';
        return res.status(403).send(message)
      }     
    } else {
      //we need to send 404 if email is not found to trigger createUser
      let message = 'No user found matching email ' + req.params.email;
      return res.status(404).send(message)
    }
  } catch (e) {
    console.log('in get by email 500 e.message ', e.message)
    return res.status(500).send(e.message)
  }
})

module.exports = router