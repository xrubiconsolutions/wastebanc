const MONGOOSE      =   require("mongoose");
const Schema        =   MONGOOSE.Schema;



const walletHistory = new Schema({
    history_date : {
        type: [Date],
        required: true,
        default: Date.now()
    }
})


const wallet_Schema = new Schema({ 
        user : {
            type: String,
            required: true
        },
        wallet_balance : {
            type: Number,
            required: true,
            default: 0
        },
        wallet_history : {
            type: walletHistory
        }

})

module.exports =  MONGOOSE.model("Wallet", wallet_Schema);
