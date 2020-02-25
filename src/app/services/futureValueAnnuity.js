const MeanWTDAVGPercent = (frequency) => {
    let meanWTDAVGPercent;
    switch (frequency) {
        case 1:
            meanWTDAVGPercent = 0.164
            break;
        case 2:
            meanWTDAVGPercent = 0.325
            break;
        case 3:
            meanWTDAVGPercent = 0.698
            break;
    }
    return meanWTDAVGPercent;
}
const SDWTDAVGPercent = (frequency) => {
    let SDWTDAVG;
    switch (frequency) {
        case 1:
            SDWTDAVG = 1.59
            break;
        case 2:
            SDWTDAVG = 2.19
            break;
        case 3:
            SDWTDAVG = 2.97
            break;
    }
    return SDWTDAVG;
}

const MeanWTDAVGReturn = frequency => {return (MeanWTDAVGPercent(frequency)/100)}

const SDWTDAVGReturn = frequency => {return (SDWTDAVGPercent(frequency)/100)}

function MarginError(frequency) {
    return ((MeanWTDAVGReturn(frequency)+1.96*(SDWTDAVGReturn(frequency)))*100).toFixed(1)
}

function WeeklyReturn(frequency) {
    return ((Math.pow((MeanWTDAVGReturn(frequency)+1), (12/52))-1)*100).toFixed(3)
}

function BiWeeklyReturn(frequency) {
    return ((Math.pow((MeanWTDAVGReturn(frequency)+1), (24/52))-1)*100).toFixed(3)
}

function CalculatePeriod(goal) {
    let amount = 0
    let key = 0
    const MeanWTDAVG = MeanWTDAVGReturn(goal.depositFrequency);
    while (goal.goalAmount > amount) {
        key++
        amount = amount + parseFloat((goal.depositAmount*Math.pow((1+MeanWTDAVG), key)).toFixed(2))
    }
    return {
        monthls: key,
        futureValue: amount
    }
}

function InvestedPrincipal(goal, period) {
    return (goal.depositAmount*period.monthls).toFixed(2)
}

function InterestEarned(goal, period) {
    return (period.futureValue - (goal.depositAmount*period.monthls)).toFixed(2)
}

function TimeTargetYears(frequency, period) {
    let years = 0
    switch (frequency) {
        case 1:
            years = (period.monthls/52).toFixed(1) 
            break;
        case 2:
            years = (period.monthls/26).toFixed(1) 
            break;
        case 3:
            years = (period.monthls/12).toFixed(1) 
            break;
    }
    return years
}

exports.MarginError = MarginError
exports.MargSDWTDAVGReturninError = SDWTDAVGReturn
exports.MeanWTDAVGReturn = MeanWTDAVGReturn
exports.WeeklyReturn = WeeklyReturn
exports.BiWeeklyReturn = BiWeeklyReturn
exports.MeanWTDAVGPercent = MeanWTDAVGPercent
exports.SDWTDAVGPercent = SDWTDAVGPercent
exports.CalculatePeriod = CalculatePeriod
exports.InvestedPrincipal = InvestedPrincipal
exports.InterestEarned = InterestEarned
exports.TimeTargetYears = TimeTargetYears