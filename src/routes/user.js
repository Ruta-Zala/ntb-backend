const express = require('express')
const router = express.Router()
const model = require('../models/user')
const ObjectID = require('../models/db').ObjectID
const utils = require('../utils')
const db = require('../models/db')

// Update a user
router.put('/:_id', async (req, res, next) => {
  try {
    const jwt = utils.getUsersJwt(req);

    if(utils.isObjectEmpty(req.body)){ 
      let message = 'Failed to update User. Data missing.';
      return res.status(500).send(message)     
    }
    const isUser = jwt.email === req.body.email;
    if (isUser){
      let results;
      const filter = {
        _id: new ObjectID(req.params._id)
      }  
      if(req.body.setLastLogin && req.body.setLastLogin === true) {
        const lastLoggedInAt = new Date()  
        const update = { 
          $set:{"lastLoggedInAt": lastLoggedInAt } 
        }
        results = await model.updateOne(filter, update)
        if (results.acknowledged === true && results.modifiedCount === 1 && results.matchedCount === 1) {
          return res.status(200).send()
        } else {
          let message = 'No user found matching _id ' + req.params._id;
          return res.status(400).send(message)
        }
      } else if(req.body.setUserCompany && req.body.setUserCompany === true){
        const update = { 
          $set:{"company": req.body.company } 
        }
        results = await model.updateOne(filter, update)
        if (results.acknowledged === true && results.modifiedCount === 1 && results.matchedCount === 1) {
          return res.status(200).send()
        } else {
          let message = 'No user found matching _id ' + req.params._id;
          return res.status(400).send(message)
        }
      } else {
        const body = req.body
        const updatedAt = new Date() 
        body.updatedAt = updatedAt
        delete body._id
        results = await db.replaceOne('networking_toolbox_data', 'users', filter, body)
        if (results.lastErrorObject.n === 1) {
          return res.status(200).send(results.value)
        } else {
          let message = 'No user found matching _id ' + req.params._id;
          return res.status(400).send(message)
        }
      }
    } else {
      let message = 'You do not have access to this resource';
      return res.status(403).send(message)
  }  
  } catch (e) {
    console.log('e is ', e)
    return res.status(500).send('Server error u100. Please contact an administrator if you continue to see this error.')
  }
})

module.exports = router