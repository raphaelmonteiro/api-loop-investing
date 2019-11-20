const express = require('express');
const { Goals, Validate, DepositFrequency } = require('../models/goals');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.use(authMiddleware);

router.post('/', async (req, res) => {
    try {
        if(await Goals.findOne({user: req.userId, active: true})) return res.status(400).send({message: "User already has goal"});

        const { error } = Validate(req.body);
        if(error) return res.status(400).send({message: `The field ${error.details[0].path} is required.`, error}); 

        const goal = await Goals.create({...req.body, user: req.userId});

        return res.send(goal)
    } catch (error) {
        res.status(400).send({message: "Failed create goal", error});
    }
})

router.put('/:goal', async (req, res) => {
    try {
        const { error } = Validate(req.body);
        if(error) return res.status(400).send({message: `The field ${error.details[0].path} is required.`, error}); 

        const goal = await Goals.findByIdAndUpdate(req.params.goal, req.body, {new: true});
        if(!goal) return res.status(400).send({message: "Goal not found"});

        return res.send(goal)
    } catch (error) {
        res.status(400).send({message: "Failed update goal", error});
    }
})

router.put('/:goal/deposit', async (req, res) => {
    try {
        const { value } = req.body;
        if(!value) return res.status(400).send({message: `The field value is required.`}); 

        const goal = await Goals.findByIdAndUpdate(req.params.goal, {$inc: { balance: value }}, {new: true});
        if(!goal) return res.status(400).send({message: "Goal not found"});

        return res.send(goal)
    } catch (error) {
        res.status(400).send({message: "Failed update goal", error});
    }
})

router.put('/:goal/withdraw', async (req, res) => {
    try {
        const { value } = req.body;
        if(!value) return res.status(400).send({message: `The field value is required.`}); 
        
        const goal = await Goals.findById(req.params.goal);
        if(!goal) return res.status(400).send({message: "Goal not found"});
        if(goal.balance < value) return res.status(400).send({message: "You don't have balance for this withdraw"});

        goal.balance = (parseFloat(goal.balance) - parseFloat(value))

        await goal.save();        

        return res.send(goal)
    } catch (error) {
        res.status(400).send({message: "Failed withdraw balance goal", error});
    }
})

router.put('/:goal/active', async (req, res) => {
    try {
        const goal = await Goals.findByIdAndUpdate(req.params.goal, {active: true}, {new: true});
        if(!goal) return res.status(400).send({message: "Goal not found"});

        return res.send(goal)
    } catch (error) {
        res.status(400).send({message: "Failed update goal", error});
    }
})

router.delete('/:goal', async (req, res) => {
    try {
        const goal = await Goals.findByIdAndUpdate(req.params.goal, {active: false}, {new: true});
        if(!goal) return res.status(400).send({message: "Goal not found"});

        return res.send(goal)
    } catch (error) {
        res.status(400).send({message: "Failed delete goal", error});
    }
})

router.get('/', async (req, res) => {
    try {
        const goals = await Goals.find({user: req.userId, active: true}).populate("user");
        if(!goals.length) return res.status(400).send({message: "Goal not found"});
        
        let list = []

        for (const goal of goals) {
            list.push(Object.assign({}, 
                goal._doc, 
                {valueFuture: calculateFutureValue(goal.depositAmount, goal.depositFrequency)}, 
                {toGoal: ((goal.balance/goal.goalAmount) * 100).toFixed(1)})
            )
        }

        return res.send(list)
    } catch (error) {
        res.status(400).send({message: "Failed load goal", error});
    }
})

module.exports = app => app.use('/goal', router)

function calculateFutureValue(depositAmount, depositFrequency) {

    let interest = 1
    if(depositFrequency === DepositFrequency.Daily.value)
        interest = 0.004/365
    if(depositFrequency === DepositFrequency.Weekly.value)
        interest = 0.004/52.14
    if(depositFrequency === DepositFrequency.Monthly.value)
        interest = 0.004/12
    
    const frequency = 12*depositFrequency

    return (depositAmount * (interest + 1) ^ frequency) + depositAmount * ((((1 + interest) ^ frequency) - 1)/1) * (1 + interest)
}