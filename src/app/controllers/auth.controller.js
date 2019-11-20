const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { secret } = require('../config/auth.json');
const crypto = require('crypto');
const {Users, Validate} = require('../models/users');
const mailer = require('../config/mailer')

const router = express.Router();

function generateToken(userId) {
    return jwt.sign({ id: userId }, secret, {expiresIn: 86400}) 
}

router.post('/signup', async (req, res) => {
    const { email } = req.body;

    try {
        const { error } = Validate(req.body);
        if(error) return res.status(400).send({message: `The field ${error.details[0].path} is required.`, error}); 

        if(await Users.findOne({ email }))
            return res.status(400).send({error: 'User already exists'})

        const user = await Users.create(req.body)

        user.password = undefined;

        return res.send({
            user,
            token: generateToken(user.id)
        });
    } catch (error) {
        return res.status(400).send({error: 'REGISTER FAILED', data: error});
    }
})

router.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    const user = await Users.findOne({ email }).where({active: true}).select('+password')

    if(!user)
        return res.status(400).send({error: 'User not found'})

    if(!await bcrypt.compare(password, user.password))
        return res.status(400).send({error: 'Invalid Password'})

    user.password = undefined;

    res.send({ 
        user, 
        token: generateToken(user.id) 
    });
})

router.post('/forgot_password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await Users.findOne({ email })

        if(!user) return res.status(400).send({error: 'User not found'})

        const token = crypto.randomBytes(20).toString('hex');

        const now = new Date();
        now.setHours(now.getHours() + 1)

        await Users.findByIdAndUpdate(user.id, {
            '$set': {
                passwordResetToken: token,
                passwordResetExpires: now
            }
        })

        mailer.sendMail({
            to: email,
            from: "raphael.hexa@gmail.com",
            template: "/forgot_password",
            context: { token }
        }, (err) => {
            return res.status(400).send({error: 'Cannot send forgot password email'})
        })

        return res.send()

    } catch (error) {
        console.log(error)
        res.status(400).send({error: 'Error forgot password.'})
    }
})

router.post('/reset_password', async (req, res) => {

    const { email, password, token } = req.body;

    try {
        const user = await Users.findOne({ email }).select("+passwordResetToken passwordResetExpires")

        if(!user)
            return res.status(400).send({error: 'User not found'})

        if(token !== user.passwordResetToken)
            return res.status(400).send({error: 'Token invalid'})

        if(new Date() > user.passwordResetExpires)
            return res.status(400).send({error: 'Token expired'})

        user.password = password;
        user.active = true

        await user.save();

        res.send()

    } catch (error) {
        res.status(400).send({error: 'Error reset password.'})
    }
})

module.exports = app => app.use('/auth', router)