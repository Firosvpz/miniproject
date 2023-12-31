const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true
    },
    description: String,

    isListed: {
        type: Boolean,
        default: true 
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
})

module.exports = mongoose.model("categories", categorySchema)