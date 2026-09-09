import mongoose from 'mongoose';

const StationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  compagnieId: { type: mongoose.Schema.Types.ObjectId, ref: "Compagnie", required: true },
  departementId: { type: mongoose.Schema.Types.ObjectId, ref: "Departement", required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  createAt: { type: Date, default: Date.now },
  updateAt: { type: Date, default: Date.now },
});

const Station = mongoose.model("Station", StationSchema);

export default Station;