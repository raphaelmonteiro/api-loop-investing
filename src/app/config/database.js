const mongoose = require('mongoose');

mongoose.connect(
    'mongodb://mongo:27017/loop', 
    {useNewUrlParser: true}
)
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('MongoDB FAILED: ', err));

mongoose.Promise = global.Promise;

module.exports = mongoose;