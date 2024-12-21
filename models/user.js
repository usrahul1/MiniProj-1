const mongo = require('mongoose')

mongo.connect("mongodb://127.0.0.1:27017/miniproject")

const userSchema = mongo.Schema({
    name: String,
    email: String,
    age: Number,
    password: String,
    post: [
        {
            type: mongo.Schema.Types.ObjectId,
            ref: 'post'
        }
    ]
})

module.exports = mongo.model('user', userSchema)