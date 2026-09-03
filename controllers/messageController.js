
import mongoose from "mongoose";
import Historique from "../models/historique.js"; // Assurez-vous que le chemin est correct

export const updateMessage = async (req, res) => {
  const { userId } = req.params;
  const newTravel = req.body;

  try {
    // Trouve l'historique de l'utilisateur
    const historique = await Historique.findOne({ userId });

    if (!historique) {
      return res.status(404).json({ message: "Historique non trouvé pour cet utilisateur." });
    }

    // Ajoute le nouvel élément de voyage au tableau "travel"
    historique.travel.push(newTravel);
    await historique.save();

    return res.status(200).json(historique);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur lors de la mise à jour de l'historique." });
  }
};





