const mongo = require('mongoose')

const postSchema = mongo.Schema({
    user:{
        type: mongo.Schema.Types.ObjectId,
        ref: 'user'
    },
    date: {
        type: Date,
        default: Date.now
    },
    content: String,
    likes: [
        {
            type: mongo.Schema.Types.ObjectId,
            ref: 'user'
        }
    ]
})

module.exports = mongo.model('post', postSchema)