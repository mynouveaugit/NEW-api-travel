import mongoose from 'mongoose';
const { Schema } = mongoose; 
const TravelNoneSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  time: { type: String, required: true },
  trajetId: { type: mongoose.Schema.Types.ObjectId, ref: "Trajet", required: true },
  compagnie:{ type: String },
  createAt: { type: Date, default: Date.now },
  updateAt: { type: Date, default: Date.now },
});


const TravelNone = mongoose.model("TravelNone", TravelNoneSchema);

export default TravelNone;
