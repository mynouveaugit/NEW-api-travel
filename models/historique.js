import mongoose from "mongoose";
const { Schema } = mongoose; 
const historiqueSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  view: { type: Boolean, default: false },
  travel: [
    {
      message: {
        type: String,
      },
      status: {
        type: String,
      },
      departure: {
        type: String,
      },
      destination: {
        type: String,
      },
      date: {
        type: String,
      },
      name: {
        type: String,
      },
      timestamp: { type: Date, default: Date.now },
      read: { type: Boolean, default: false },
      del_user: { type: mongoose.Schema.Types.ObjectId, ref: "User"},
      del_name: {
        type: String,
      },
      
    },
  ],

});
const Historique = mongoose.model("historique", historiqueSchema)

export default Historique;

