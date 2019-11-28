const mongoose = require('../config/database');
const Joi = require('joi');

const riskTypes = [
    {type: "VERYLOW", value: 1},
    {type: "LOW", value: 2},
    {type: "MEDIUM", value: 3},
    {type: "HIGH", value: 4},
    {type: "VERYHIGH", value: 5}
];

const GoalsSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    goalAmount: {
        type: Number,
        require: true
    },
    depositFrequency: {
        type: Number,
        require: true,
        min: 1,
        max: 3
    },
    depositAmount: {
        type: Number,
        require: true
    },
    balance: {
        type: Number,
        require: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true
    },
    risk: {
        type: Number,
        require: true,
        min: 1,
        max: 5
    },
    active: {
        type: Boolean,
        required: true,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const DepositFrequency = {
    "Daily": { value: 1 },
    "Weekly": { value: 2 },
    "Monthly": { value: 3 }
}

const Validate = goal => {
    const schema = {
        name: Joi.string().required(),
        goalAmount: Joi.number().required(),
        depositFrequency: Joi.number().min(1).max(3).required(),
        depositAmount: Joi.number().required(),
        risk: Joi.number().min(1).max(5),
        balance: Joi.number()
    }
    
    return Joi.validate(goal, schema);
}

const ValidatePreview = goal => {
    const schema = {
        goalAmount: Joi.number().required(),
        depositFrequency: Joi.number().min(1).max(3).required(),
        depositAmount: Joi.number().required(),
        risk: Joi.number().min(1).max(5),
    }
    
    return Joi.validate(goal, schema);
}

GoalsSchema.pre('save', async function (next) {
    if(!this.balance) {
        this.balance = 0.00
    }

    if(!this.risk) {
        this.risk = riskTypes[2].value
    } else {
        riskTypes.map((risk, index) => {
            if(this.risk == risk.value) this.risk = riskTypes[index].value
        })
    }
    
    next();
})

const Goals = mongoose.model('Goal', GoalsSchema);

exports.Goals = Goals;
exports.Validate = Validate;
exports.ValidatePreview = ValidatePreview;
exports.DepositFrequency = DepositFrequency;
