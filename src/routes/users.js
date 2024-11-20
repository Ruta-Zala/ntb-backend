const express = require('express')
const router = express.Router()
const model = require('../models/users')
const ObjectID = require('../models/db').ObjectID
const db = require('../models/db')
const utils = require('../utils')

// find all users
//NOTE this should be put behind a check for admin level access
router.get('/', async (req, res) => {
  try {
    const users = await model.find()
    if(users.length > 0){
      return res.status(200).send(users)
    } else {
      return res.status(404).send('Could not get users')
    } 
  } catch (e) {
    return res.status(500).send(e.message)
  }
})

// find one user
//NOTE this should be put behind a check for admin level access
router.get('/:id', async (req, res) => {
  try {
    const jwt = utils.getUsersJwt(req);
    const isUser = jwt.email === req.body.email 
    if (isUser) {
      const query = {
        _id: new ObjectID(req.params.id)
      }
      const results = await model.findOne(query)
      if (results) {
        return res.status(200).send(results)
      } else {
        let message = 'No user found matching id ' + req.params.id;
        return res.status(404).send(message)
      }
    } else {
      let message = 'You do not have access to this resource';
      return res.status(403).send(message)
    } 
  } catch (e) {
    return res.status(500).send(e.message)
  }
 })


// create new User
router.post('/', async (req, res) => {
  try {
    const jwt = utils.getUsersJwt(req);
    const isUser = jwt.email === req.body.email 

    if(utils.isObjectEmpty(req.body)){
      let message = 'Failed to create new User. Data missing.';
      return res.status(500).send(message)
    }
      
    if (isUser){
      const email = req.body.email 
      const firstName = req.body.firstName  
      const lastName = req.body.lastName  
      const displayName = req.body.displayName
      const agreementAccepted = req.body.agreementAccepted   
      const avatar = req.body.avatar
      const isEnabled = req.body.isEnabled
      const locale = req.body.locale
      const accessLevel = req.body.accessLevel
      const createdAt = new Date()
      const updatedAt = new Date()   

      await model.insertOne({
        email,
        firstName,
        lastName,
        displayName,
        agreementAccepted,
        avatar,
        isEnabled,
        locale,
        accessLevel,
        createdAt,
        updatedAt
      })
      return res.status(200).send()
    } else {
      let message = 'You do not have access to this resource';
      return res.status(403).send(message)
    } 
  } catch (e) {
    const message = 'Failed to create new User:' + e.message;
    return res.status(500).send(message)
  }
})


// Update an user
router.put('/:_id', async (req, res) => {
  try {
    const jwt = utils.getUsersJwt(req);
    const isUser = jwt.email === req.body.email;

    if(utils.isObjectEmpty(req.body)){
      let message = 'Failed to update User. Data missing.';
      return res.status(500).send(message)
    }

    if (isUser) {
      const query = {
        _id: new ObjectID(req.params._id)
      }       
      const body = req.body
      const updatedAt = new Date() 
      body.updatedAt = updatedAt
      delete body._id
      const results = await db.replaceOne('networking_toolbox_data', 'userr', query, body)
      if (results.lastErrorObject.n === 1) {
        return res.status(200).send(results.value)
      } else {
        let message = 'No user found matching _id ' + req.params._id;
        return res.status(400).send(message)
      }
    } else {
      let message = 'You do not have access to this resource';
      return res.status(403).send(message)
    } 
  } catch (e) {
    return res.status(500).send('Server error. Please contact an administrator if you continue to see this error.')
  }
})

// delete a user
router.delete('/', async (req, res) => {
  try {
    if (!req.query.id || !req.query.id.length) {
      return res.status(400).send('Invalid input. id is a required URL query parameter.')
    }
    const jwt = utils.getUsersJwt(req);
    const isUser = jwt.email === req.body.email;
    if (isUser) {
      const query = {
        _id: new ObjectID(req.query.id)
      }
      const results = await model.removeOne(query)
      if (results.acknowledged === true && results.deletedCount === 1) {
        return res.status(200).send()
      } else {
        let message = 'No user found matching _id  ' + req.query.id;
        return res.status(400).send(message)
      }
    } else {
      let message = 'You do not have access to this resource';
      return res.status(403).send(message)
    } 
  } catch (e) {
    return res.status(500).send(e.message)
  }
})

module.exports = router