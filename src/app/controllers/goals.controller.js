const express = require('express');
const authMiddleware = require('../middlewares/auth');
const router = express.Router();
const { 
    Goals, 
    Validate, 
    ValidatePreview, 
    DepositFrequency, 
    GetTypeFrequecy } = require('../models/goals');
const { 
    MarginError, 
    SDWTDAVGPercent, 
    WeeklyReturn, 
    BiWeeklyReturn, 
    MeanWTDAVGPercent,
    CalculatePeriod,
    InvestedPrincipal,
    InterestEarned,
    TimeTargetYears } = require('../services/futureValueAnnuity')

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
        const { error } = ValidatePreview(req.body);
        if(error) return res.status(400).send({message: `The field ${error.details[0].path} is required.`, error}); 
        return res.send({projectedBalance: futureValues(req.body)})
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

router.get('/:goalId/target', async (req, res) => {
    try {
        const goal = await Goals.findById(req.params.goalId);
        
        return res.send(futureValues(goal))
    } catch (error) {
        console.log(error)
        res.status(400).send({message: "Failed get target goal", error});
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
            stock: 'SPY',
            balance: valuesSplit[0].toFixed(2),
            shares: Math.ceil(valuesSplit[0]/262),
            color: "#f542dd"
        },{
            stock: 'QQQ',
            balance: valuesSplit[1].toFixed(2),
            shares: Math.ceil(valuesSplit[0]/298),
            color: "#f5b942"
        },
        {
            stock: 'VO',
            balance: valuesSplit[2].toFixed(2),
            shares: Math.ceil(valuesSplit[0]/149),
            color: "#e0f542"
        },
        {
            stock: 'LQD',
            balance: valuesSplit[3].toFixed(2),
            shares: Math.ceil(valuesSplit[0]/352),
            color: "#dedede"
        },
        {
            stock: 'GOVT',
            balance: valuesSplit[4].toFixed(2),
            shares: Math.ceil(valuesSplit[0]/53),
            color: "#aee3e6"
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
            let balance = goal.balance || getRandomNumber(0, (goal.goalAmount*0.8), 2, goal.goalAmount)[0]
            list.push(Object.assign({}, 
                goal._doc, 
                {balance},
                {toGoalPercent: ((balance/goal.goalAmount) * 100).toFixed(2)},
                {toGoal: (parseFloat(goal.goalAmount) - parseFloat(balance)).toFixed(2)},
                {futureValues: futureValues(goal)})
            )
        }

        return res.send(list)
    } catch (error) {
        res.status(400).send({message: "Failed load goal", error});
    }
})

module.exports = app => app.use('/goal', router)

function futureValues(goal) {
    const period = CalculatePeriod(goal)

    const target = {
        input:  goal.depositAmount,
        frequency: GetTypeFrequecy(goal.depositFrequency)[0].type,
        target:  goal.goalAmount,
        timeTarget: period.monthls,
        timeTargetYears: parseFloat(TimeTargetYears(goal.depositFrequency, period)),
        MarginError: parseFloat(MarginError(goal.depositFrequency)),
        MeanWTDAVGReturn: MeanWTDAVGPercent(goal.depositFrequency),
        SDWTDAVGReturn: SDWTDAVGPercent(goal.depositFrequency),
        weeklyReturn: parseFloat(WeeklyReturn(goal.depositFrequency)),
        biWeeklyReturn: parseFloat(BiWeeklyReturn(goal.depositFrequency)),
        InvestedPrincipal: parseFloat(InvestedPrincipal(goal, period)),
        InterestEarned: parseFloat(InterestEarned(goal, period)),
        futureValue: parseFloat(period.futureValue.toFixed(2))
    }

    return target;
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
