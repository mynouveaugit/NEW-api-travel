import Departement from "../models/Departement.js";

const addDepartement = async (req, res) => {
  try {
    const { name, ville, country, code } = req.body;

    if (!name || !ville || !country) {
      return res.status(400).json({
        success: false,
        error: "Les champs 'name', 'ville' et 'country' sont requis.",
      });
    }

    const existingDepartement = await Departement.findOne({ name, ville, country });
    if (existingDepartement) {
      return res.status(400).json({
        success: false,
        error: "Ce département existe déjà pour cette ville et ce pays.",
      });
    }

    const newDepartement = new Departement({
      name,
      ville,
      country,
      code,
    });

    await newDepartement.save();

    return res.status(201).json({ success: true, departement: newDepartement });
  } catch (error) {
    console.error("Erreur lors de l'ajout d'un département :", error);
    return res.status(500).json({
      success: false,
      error: "Erreur du serveur lors de l'ajout d'un département.",
    });
  }
};

const getDepartements = async (req, res) => {
  try {
    const departements = await Departement.find();
    return res.status(200).json({ success: true, departements });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Erreur du serveur lors de la récupération des départements.",
    });
  }
};

// Récupérer les départements par pays
const getDepartementsByCountry = async (req, res) => {
  try {
    const { country } = req.params;
    const departements = await Departement.find({ country });
    return res.status(200).json({ success: true, departements });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Erreur du serveur lors de la récupération des départements.",
    });
  }
};

const getDepartement = async (req, res) => {
  try {
    const { id } = req.params;
    const departement = await Departement.findById(id);

    if (!departement) {
      return res.status(404).json({ success: false, error: "Département non trouvé." });
    }

    return res.status(200).json({ success: true, departement });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Erreur du serveur lors de la récupération du département.",
    });
  }
};

const editDepartement = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, ville, country, code } = req.body;

    const departement = await Departement.findById(id);
    if (!departement) {
      return res.status(404).json({ success: false, error: "Département non trouvé." });
    }

    if (name) departement.name = name;
    if (ville) departement.ville = ville;
    if (country) departement.country = country;
    if (code) departement.code = code;

    departement.updateAt = Date.now();

    await departement.save();

    return res.status(200).json({ success: true, departement });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du département :", error);
    return res.status(500).json({
      success: false,
      error: "Erreur du serveur lors de la mise à jour du département.",
    });
  }
};

const deleteDepartement = async (req, res) => {
  try {
    const { id } = req.params;

    const departement = await Departement.findById(id);
    if (!departement) {
      return res.status(404).json({ success: false, error: "Département non trouvé." });
    }

    await Departement.findByIdAndDelete(id);

    return res.status(200).json({ success: true, message: "Département supprimé avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression du département :", error);
    return res.status(500).json({
      success: false,
      error: "Erreur du serveur lors de la suppression du département.",
    });
  }
};

export {
  addDepartement,
  getDepartements,
  getDepartementsByCountry,
  getDepartement as getDepartment,
  editDepartement as updateDepartment,
  deleteDepartement as deleteDepartment,
};