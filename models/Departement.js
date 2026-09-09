import mongoose from 'mongoose';

const DepartementSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ville: { type: String, required: true },
  country: { type: String, required: true },
  code: { type: String },
  createAt: { type: Date, default: Date.now },
  updateAt: { type: Date, default: Date.now },
});

const Departement = mongoose.model("Departement", DepartementSchema);

export default Departement;