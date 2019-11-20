const express = require('express');
const authMiddleware = require('../middlewares/auth');
const { Users, ValidateUpdate } = require('../models/users')

const router = express.Router();

router.use(authMiddleware);

router.get('', async (req, res) => {
    try {
        const user = await Users.findById(req.userId).where({active: true})
        if(!user) return res.status(400).send({message: "user not found"});

        return res.send(user);
    } catch (error) {
        res.status(400).send({message: "Failed get user", error});
    }
})

router.put('', async (req, res) => {
    try {
        const { error } = ValidateUpdate(req.body);
        if(error) return res.status(400).send({message: `The field ${error.details[0].path} is required.`, error}); 

        const user = await Users.findByIdAndUpdate(req.userId, req.body, {new: true});
        if(!user) return res.status(400).send({message: "user not found"});

        return res.send(user)
    } catch (error) {
        res.status(400).send({message: "Failed update user", error});
    }
})

router.delete('', async (req, res) => {
    try {
        const user = await Users.findByIdAndUpdate(req.userId, {active: false}, {new: true});
        if(!user) return res.status(400).send({message: "user not found"});

        return res.send(user)
    } catch (error) {
        res.status(400).send({message: "Failed delete user", error});
    }
})

router.put('/active', async (req, res) => {
    try {
        const user = await Users.findByIdAndUpdate(req.userId, {active: true}, {new: true});
        if(!user) return res.status(400).send({message: "user not found"});

        return res.send(user)
    } catch (error) {
        res.status(400).send({message: "Failed active user", error});
    }
})

module.exports = app => app.use('/user', router)