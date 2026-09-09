import axios from "axios";
import multer from "multer";
import Compagnie from "../models/Compagnie.js";
import Station from "../models/Station.js";
;

import FormData from "form-data"; // Import nécessaire pour FormData côté serveur

// Configuration de Multer pour gérer les fichiers uploadés
const upload = multer({ storage: multer.memoryStorage() });

// Clé API ImgBB (remplacez par votre clé API ImgBB)
const imgbbAPIKey = "371ffd79ffd8cbe53799be1df6fc59f4";


// Ajouter une compagnie avec une image
const addCompagnie = async (req, res) => {
  try {
    const { name } = req.body;
    const imageFile = req.file; // Image envoyée via la requête

    // Validation des données
    if (!name || !imageFile) {
      return res.status(400).json({ success: false, error: "Le champ 'name' et une image sont requis." });
    }

    console.log("Création d'une nouvelle Compagnie :", { name });

    // Convertir l'image en base64 pour l'envoyer à ImgBB
    const imageBase64 = imageFile.buffer.toString("base64");

    // Créer FormData pour ImgBB
    const formData = new FormData();
    formData.append("image", imageBase64);

    // Télécharger l'image sur ImgBB
    const imgbbResponse = await axios.post(
      `https://api.imgbb.com/1/upload?key=${imgbbAPIKey}`,
      formData,
      { headers: formData.getHeaders() }
    );

    const imageUrl = imgbbResponse.data.data.url; // URL de l'image retournée par ImgBB

    // Créer une nouvelle compagnie avec l'URL de l'image
    const newComp = new Compagnie({
      name,
      image: imageUrl,
    });

    await newComp.save();

    console.log("Compagnie créée :", newComp);

    return res.status(201).json({ success: true, compagnie: newComp });
  } catch (error) {
    console.error("Erreur lors de l'ajout d'une compagnie :", error);
    return res.status(500).json({ success: false, error: "Erreur du serveur lors de l'ajout d'une compagnie." });
  }
};

// Récupérer toutes les compagnies
const getCompagnies = async (req, res) => {
  try {
    const Compagnies = await Compagnie.find();
    return res.status(200).json({ success: true, Compagnies });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Erreur du serveur lors de la récupération des compagnies.",
    });
  }
};

// Récupérer une seule compagnie par ID
const getCompagnie = async (req, res) => {
  try {
    const { id } = req.params;
    const compagnie = await Compagnie.findById({ _id: id });

    if (!compagnie) {
      return res.status(404).json({ success: false, error: "Compagnie non trouvée." });
    }

    return res.status(200).json({ success: true, compagnie });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Erreur du serveur lors de la récupération de la compagnie.",
    });
  }
};


// Supprimer une compagnie par ID
const deleteCompagnie = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Vérifier si la compagnie existe
      const compagnie = await Compagnie.findById(id);
      if (!compagnie) {
        return res.status(404).json({ success: false, error: "Compagnie non trouvée." });
      }
  
      // Supprimer la compagnie
      await Compagnie.findByIdAndDelete(id);
  
      return res.status(200).json({ success: true, message: "Compagnie supprimée avec succès." });
    } catch (error) {
      console.error("Erreur lors de la suppression de la compagnie :", error);
      return res.status(500).json({ success: false, error: "Erreur du serveur lors de la suppression de la compagnie." });
    }
  };
  
  // Modifier une compagnie
  const editCompagnie = async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const imageFile = req.file;
  
      // Vérifier si la compagnie existe
      const compagnie = await Compagnie.findById(id);
      if (!compagnie) {
        return res.status(404).json({ success: false, error: "Compagnie non trouvée." });
      }
  
      // Si un nouveau nom est fourni, le mettre à jour
      if (name) {
        compagnie.name = name;
      }
  
      // Si une nouvelle image est fournie, la télécharger sur ImgBB
      if (imageFile) {
        const imageBase64 = imageFile.buffer.toString("base64");
  
        const formData = new FormData();
        formData.append("image", imageBase64);
  
        const imgbbResponse = await axios.post(
          `https://api.imgbb.com/1/upload?key=${imgbbAPIKey}`,
          formData,
          { headers: formData.getHeaders() }
        );
  
        const imageUrl = imgbbResponse.data.data.url;
        compagnie.image = imageUrl; // Mettre à jour l'URL de l'image
      }
  
      // Sauvegarder les modifications
      await compagnie.save();
  
      return res.status(200).json({ success: true, compagnie });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la compagnie :", error);
      return res.status(500).json({ success: false, error: "Erreur du serveur lors de la mise à jour de la compagnie." });
    }
  };
  

// Ajouter une gare pour une compagnie
const addStation = async (req, res) => {
  try {
    const { name, compagnieId, departementId, latitude, longitude } = req.body;

    if (!name || !compagnieId || !departementId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, error: "Tous les champs sont requis." });
    }

    const compagnie = await Compagnie.findById(compagnieId);
    if (!compagnie) {
      return res.status(404).json({ success: false, error: "Compagnie non trouvée." });
    }

    const departement = await Departement.findById(departementId);
    if (!departement) {
      return res.status(404).json({ success: false, error: "Département non trouvé." });
    }

    const existingStation = await Station.findOne({ name, compagnieId });
    if (existingStation) {
      return res.status(400).json({ success: false, error: "Cette gare existe déjà pour cette compagnie." });
    }

    const newStation = new Station({
      name,
      compagnieId,
      departementId,
      latitude,
      longitude,
    });

    await newStation.save();

    return res.status(201).json({ success: true, station: newStation });
  } catch (error) {
    console.error("Erreur lors de l'ajout d'une gare :", error);
    return res.status(500).json({ success: false, error: "Erreur du serveur lors de l'ajout d'une gare." });
  }
};

// Récupérer toutes les gares
const getStations = async (req, res) => {
  try {
    const stations = await Station.find()
      .populate('compagnieId', 'name image')
      .populate('departementId', 'name ville country');

    return res.status(200).json({ success: true, stations });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Erreur du serveur lors de la récupération des gares.",
    });
  }
};

// Récupérer les gares d'une compagnie
const getStationsByCompagnie = async (req, res) => {
  try {
    const { compagnieId } = req.params;

    const stations = await Station.find({ compagnieId })
      .populate('departementId', 'name ville country');

    return res.status(200).json({ success: true, stations });
  } catch (error) {
    console.error("Erreur lors de la récupération des gares :", error);
    return res.status(500).json({
      success: false,
      error: "Erreur du serveur lors de la récupération des gares.",
    });
  }
};

// Récupérer les gares d'une compagnie filtrées par département (utile pour le formulaire de trajet)
const getStationsByCompagnieAndDepartement = async (req, res) => {
  try {
    const { compagnieId, departementId } = req.params;

    const stations = await Station.find({ compagnieId, departementId })
      .populate('departementId', 'name ville country');

    return res.status(200).json({ success: true, stations });
  } catch (error) {
    console.error("Erreur lors de la récupération des gares :", error);
    return res.status(500).json({
      success: false,
      error: "Erreur du serveur lors de la récupération des gares.",
    });
  }
};

// Récupérer une seule gare par ID
const getStation = async (req, res) => {
  try {
    const { id } = req.params;
    const station = await Station.findById(id)
      .populate('compagnieId', 'name image')
      .populate('departementId', 'name ville country');

    if (!station) {
      return res.status(404).json({ success: false, error: "Gare non trouvée." });
    }

    return res.status(200).json({ success: true, station });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Erreur du serveur lors de la récupération de la gare.",
    });
  }
};

// Modifier une gare
const editStation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, departementId, latitude, longitude } = req.body;

    const station = await Station.findById(id);
    if (!station) {
      return res.status(404).json({ success: false, error: "Gare non trouvée." });
    }

    if (departementId) {
      const departement = await Departement.findById(departementId);
      if (!departement) {
        return res.status(404).json({ success: false, error: "Département non trouvé." });
      }
      station.departementId = departementId;
    }

    if (name) station.name = name;
    if (latitude !== undefined) station.latitude = latitude;
    if (longitude !== undefined) station.longitude = longitude;

    station.updateAt = Date.now();

    await station.save();

    return res.status(200).json({ success: true, station });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la gare :", error);
    return res.status(500).json({ success: false, error: "Erreur du serveur lors de la mise à jour de la gare." });
  }
};

// Supprimer une gare
const deleteStation = async (req, res) => {
  try {
    const { id } = req.params;

    const station = await Station.findById(id);
    if (!station) {
      return res.status(404).json({ success: false, error: "Gare non trouvée." });
    }

    await Station.findByIdAndDelete(id);

    return res.status(200).json({ success: true, message: "Gare supprimée avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression de la gare :", error);
    return res.status(500).json({ success: false, error: "Erreur du serveur lors de la suppression de la gare." });
  }
};

export {
  addStation,
  getStations,
  getStationsByCompagnie,
  getStationsByCompagnieAndDepartement,
  getStation,
  editStation,
  deleteStation,
};























  export { addCompagnie, getCompagnies, getCompagnie, deleteCompagnie, editCompagnie, upload };
  


