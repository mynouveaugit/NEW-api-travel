import mongoose from 'mongoose';

const TrajetSchema = new mongoose.Schema({
  departure: { type: mongoose.Schema.Types.ObjectId, ref: 'Departement', required: true },
  destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Departement', required: true },
  price: { type: Number, required: true },
  duree: { type: String },
  compagnieId: { type: mongoose.Schema.Types.ObjectId, ref: "Compagnie" },
  stations: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Station" }
  ],
  hours: [
    {
      time: {
        type: String,
      }
    }
  ],
  days: [
    {
      date: { type: Number },
    }
  ],
  createAt: { type: Date, default: Date.now },
  updateAt: { type: Date, default: Date.now },
});

const Trajet = mongoose.model("Trajet", TrajetSchema);

export default Trajet;