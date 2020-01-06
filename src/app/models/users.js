const mongoose = require('../config/database');
const bcrypt = require('bcryptjs');
const Joi = require('joi');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true
    },
    phone: {
        type: String,
        require: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    passwordResetToken: {
        type: String,
        select: false
    },
    passwordResetExpires: {
        type: Date,
        select: false
    },  
    active: {
        type: Boolean,
        require: true,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    qn_inv_experience: {
        type: Number,
        require: true
    },
    qn_inv_risk: {
        type: Number,
        require: true
    },
    qn_inv_have_other_investments: {
        type: Number,
        require: true
    }
});

UserSchema.pre('save', async function (next) {
    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
    
    next();
})

const ValidateUpdate = user => {
    const schema = {
        name: Joi.string().required(),
        email: Joi.string().required(),
        phone: Joi.string().required()
    }
    
    return Joi.validate(user, schema);
}

const Validate = user => {
    const schema = {
        name: Joi.string().required(),
        email: Joi.string().required(),
        phone: Joi.string().required(),
        password: Joi.string().required(),
        qn_inv_experience: Joi.number().required(),
        qn_inv_risk: Joi.number().required(),
        qn_inv_have_other_investments: Joi.number().required()
    }
    
    return Joi.validate(user, schema);
}

const User = mongoose.model('User', UserSchema);

exports.Users = User;
exports.Validate = Validate;
exports.ValidateUpdate = ValidateUpdate;