const express = require('express');
const { Goals, Validate, ValidatePreview, DepositFrequency } = require('../models/goals');
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

router.post('/preview', async (req, res) => {
    try {
        console.log('aqui')
        const { error } = ValidatePreview(req.body);
        if(error) return res.status(400).send({message: `The field ${error.details[0].path} is required.`, error}); 
        console.log('aqui2')
        const { depositAmount, depositFrequency } = req.body
        console.log('aqui3')
        return res.send({projectedBalance: calculateFutureValue(depositAmount, depositFrequency)})
    } catch (error) {
        res.status(400).send({message: "Failed in calculate preview goal", error});
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

router.get('/resumeActive', async (req, res) => {
    try {
        const goals = await Goals.find({user: req.userId, active: true}).populate("user");
        if(!goals.length) return res.status(400).send({message: "Goal not found"});
        const goal = goals[0]
        const valuesSplit = getRandomNumber(300, goal.goalAmount, 5, goal.goalAmount);

        let actives = [{
            stock: 'AAPL',
            balance: valuesSplit[0].toFixed(2),
            shares: Math.ceil(valuesSplit[0]/262)
        },{
            stock: 'ADBE',
            balance: valuesSplit[1].toFixed(2),
            shares: Math.ceil(valuesSplit[0]/298)
        },
        {
            stock: 'MSFT',
            balance: valuesSplit[2].toFixed(2),
            shares: Math.ceil(valuesSplit[0]/149)
        },
        {
            stock: 'TSLA',
            balance: valuesSplit[3].toFixed(2),
            shares: Math.ceil(valuesSplit[0]/352)
        },
        {
            stock: 'ATVI',
            balance: valuesSplit[4].toFixed(2),
            shares: Math.ceil(valuesSplit[0]/53)
        }]

        return res.send({profitToday: 27.1, profit: 7.29, actives})
    } catch (error) {
        res.status(400).send({message: "Failed load goal", error});
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

    const result = (depositAmount * (interest + 1) ^ frequency) + depositAmount * ((((1 + interest) ^ frequency) - 1)/1) * (1 + interest)

    return result.toFixed(2)
}

function getRandomNumber(min, max, length, sum) {
    return Array.from(
        { length },
        (_, i) => {
            var smin = (length - i - 1) * min,
                smax = (length - i - 1) * max,
                offset = Math.max(sum - smax, min),
                random = 1 + Math.min(sum - offset, max - offset, sum - smin - min),
                value = Math.floor(Math.random() * random + offset);

            sum -= value;
            return value;
        }
    );
}