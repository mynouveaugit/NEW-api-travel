import mongoose from 'mongoose';
const { Schema } = mongoose;

const TravelNoneSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  time: { type: String, required: true },
  trajetId: { type: mongoose.Schema.Types.ObjectId, ref: "Trajet", required: true },
  compagnie: { type: String },
  // null/undefined = trajet totalement indisponible ce jour-là (comportement actuel, inchangé)
  // un nombre >= 0 = il reste ce nombre de places (0 inclus, différent de "aucune restriction")
  placesRestantes: { type: Number, default: null, min: 0 },
  createAt: { type: Date, default: Date.now },
  updateAt: { type: Date, default: Date.now },
});

const TravelNone = mongoose.model("TravelNone", TravelNoneSchema);

export default TravelNone;