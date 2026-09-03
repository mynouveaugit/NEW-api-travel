import Trajet from "../models/Trajet.js"
import bcrypt from 'bcryptjs'
import Departement from "../models/Departement.js"
import User from "../models/User.js"
import Travel from "../models/Travel.js"
import mongoose from "mongoose"
import { io } from "../index.js";
import Historique from '../models/historique.js';
import axios from 'axios';

const NewSendEmail = async (email, title, message) => {
  try {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { name: 'E-travelMali', email: process.env.GMAIL_USER },
        to: [{ email }],
        subject: title,
        textContent: message,
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`E-mail envoyé avec succès à ${email}`);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'e-mail:", error.response?.data || error.message);
  }
};
 const addTravel = async (req, res) => {
  try {
    const {
      date,
      places,
      travelId,
      name,
      nombre,
      priceTotal,
      time,
      userId,
      trajetId,
      compagnie
    } = req.body;

    // Valider les champs obligatoires
    if (!date || !time || !travelId || !name || !nombre || !userId || !trajetId || !compagnie) {
      return res.status(400).json({ message: 'Veuillez remplir tous les champs obligatoires.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const phone = user.telephone
    // Récupérer la durée du trajet associé
    const trajet = await Trajet.findById(trajetId).populate(['departure', 'destination']);    if (!trajet) {
      return res.status(404).json({ message: 'Trajet introuvable.' });
    }
    
    const duree = trajet.duree; // Durée du trajet en format HH:mm
    
     

    // Calculer l'heure d'arrivée en additionnant `time` et `duree`
    const calculateArrivalTime = (startTime, duration) => {
      const [startHours, startMinutes] = startTime.split(':').map(Number); // Départ: HH:mm
      const [durationHours, durationMinutes] = duration.split(':').map(Number); // Durée: HH:mm

      // Calcul mathématique
      const totalMinutes = startMinutes + durationMinutes;
      const extraHours = Math.floor(totalMinutes / 60); // Minutes additionnelles
      const arrivalMinutes = totalMinutes % 60;

      const totalHours = startHours + durationHours + extraHours;
      const arrivalHours = totalHours % 24; // Limiter à 24 heures

      // Retourner le temps formaté
      return `${String(arrivalHours).padStart(2, '0')}:${String(arrivalMinutes).padStart(2, '0')}`;
    };

    const arrived = calculateArrivalTime(time, duree); 
    
// Calcul de l’heure d’arrivée

    // Créer une nouvelle instance de Travel
    const newTravel = new Travel({
      date,
      places,
      travelId,
      name,
      nombre,
      priceTotal,
      time,
      arrived, // Horaire calculée
      userId,
      trajetId,
      phone,
      compagnie,
    });

    // Sauvegarder dans la base de données
    await newTravel.save();



    // Mettre à jour l'historique de l'utilisateur
    const historique = await Historique.findOne({ userId });
    if (historique) {
      historique.view=false
      historique.travel.push({
        message: 'Votre Voyage: '+travelId+' est réservé avec succèss. Veuillez pour valider et payer pour competer la reservation',
        departure: trajet.departure.ville,
        destination: trajet.destination.ville,
        date,
        status: 'attente',
        name,
      });
      await historique.save();
    }

  await NewSendEmail(user.email,"Reservation "+travelId,"Votre Voyage: "+travelId+" est réservé avec succèss. Veuillez patienter pour valider et payer le E Ticket pour competer la reservation");



    io.emit("travel_added", newTravel);

    res.status(201).json({
      success: true,
      message: 'Voyage ajouté avec succès.',
      travel: newTravel,
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du voyage :', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

const addTravelAgent= async (req, res) => {
  try {
    const {
      date,
      places,
      travelId,
      name,
      nombre,
      priceTotal,
      time,
      userId,
      trajetId,
      compagnie
    } = req.body;

    // Valider les champs obligatoires
    if (!date || !time || !travelId || !name || !nombre || !userId || !trajetId || !compagnie) {
      return res.status(400).json({ message: 'Veuillez remplir tous les champs obligatoires.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const phone = user.telephone
    // Récupérer la durée du trajet associé
    const trajet = await Trajet.findById(trajetId).populate(['departure', 'destination']);    if (!trajet) {
      return res.status(404).json({ message: 'Trajet introuvable.' });
    }
    
    const duree = trajet.duree; // Durée du trajet en format HH:mm
    
     

    // Calculer l'heure d'arrivée en additionnant `time` et `duree`
    const calculateArrivalTime = (startTime, duration) => {
      const [startHours, startMinutes] = startTime.split(':').map(Number); // Départ: HH:mm
      const [durationHours, durationMinutes] = duration.split(':').map(Number); // Durée: HH:mm

      // Calcul mathématique
      const totalMinutes = startMinutes + durationMinutes;
      const extraHours = Math.floor(totalMinutes / 60); // Minutes additionnelles
      const arrivalMinutes = totalMinutes % 60;

      const totalHours = startHours + durationHours + extraHours;
      const arrivalHours = totalHours % 24; // Limiter à 24 heures

      // Retourner le temps formaté
      return `${String(arrivalHours).padStart(2, '0')}:${String(arrivalMinutes).padStart(2, '0')}`;
    };

    const arrived = calculateArrivalTime(time, duree); 
    
// Calcul de l’heure d’arrivée

    // Créer une nouvelle instance de Travel
    const payed=true;
    const newTravel = new Travel({
      date,
      places,
      travelId,
      name,
      nombre,
      priceTotal,
      time,
      arrived, // Horaire calculée
      userId,
      trajetId,
      phone,
      compagnie,
      payed
    });

    // Sauvegarder dans la base de données
    await newTravel.save();



    // Mettre à jour l'historique de l'utilisateur
    const historique = await Historique.findOne({ userId });
    if (historique) {
      historique.view=false
      historique.travel.push({
        message: 'Votre Voyage: '+travelId+' est réservé avec succèss. Veuillez pour valider et payer pour competer la reservation',
        departure: trajet.departure.ville,
        destination: trajet.destination.ville,
        date,
        status: 'attente',
        name,
      });
      await historique.save();
    }

  await NewSendEmail(user.email,"Reservation "+travelId,"Votre Voyage: "+travelId+" est réservé avec succèss. Veuillez patienter pour valider et payer le E Ticket pour competer la reservation");



    io.emit("travel_added", newTravel);

    res.status(201).json({
      success: true,
      message: 'Voyage ajouté avec succès.',
      travel: newTravel,
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du voyage :', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};


const addPlaceToTravel = async (req, res) => {
  try {
    const { id } = req.params;
    const { place } = req.body;

    // Trouver le voyage par ID
    const travel = await Travel.findById(id).populate({
      path: 'trajetId',
      populate: ['departure', 'destination'],
    });  
    
    const user = await User.findById(travel.userId);


    
    if (!travel) {
      return res.status(404).json({ success: false, message: "Voyage non trouvé." });
    }

    // Vérifier si la place est déjà réservée
    const isPlaceTaken = travel.places.some((p) => p.place == place);
    if (isPlaceTaken) {
      return res
        .status(400)
        .json({ success: false, message: "Ce numéro de place est déjà réservé pour ce voyage." });
    }

    // Vérifier si le voyage est complet
    if (travel.places.length >= travel.nombre) {
      return res
        .status(400)
        .json({ success: false, message: "Aucune autre place ne peut être ajoutée. Le voyage est complet." });
    }

    // Ajouter la nouvelle place
    travel.places.push({ place });

    // Marquer le voyage comme "complet" si toutes les places sont réservées
    if (travel.places.length === travel.nombre) {
      travel.valide = true;
    }

    // Sauvegarder les modifications
    await travel.save();

    // Mettre à jour l'historique de l'utilisateur
const historique = await Historique.findOne({ userId: travel.userId });
historique.view=false

if (historique) {
  historique.travel.push({
    message: 'Votre Voyage '+travel.travelId+' reservé validé avec succès. Veuillez retrouver votre numéro de place disponible sur le ticket et patienter pour le payement vous aurez un message vous invitant à valider le payement.',
    departure: travel.trajetId.departure.ville,
    destination: travel.trajetId.destination.ville,
    date: travel.date,
    status: 'valide',
  });
  await historique.save();
}

await NewSendEmail(user.email,"Reservation "+travel.travelId,'Votre Voyage '+travel.travelId+' reservé validé avec succès. Veuillez retrouver votre numéro de place disponible sur le ticket, et patienter pour le payement vous aurez un message vous invitant à valider le payement.');



    io.emit("place_added", travel);
    io.emit("place_added", historique);

    return res.status(200).json({
      success: true,
      message: "Place ajoutée avec succès.",
      travel,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'ajout de la place.",
    });
  }
};


const validateTravel = async (req, res) => {
  try {
    const { id } = req.params;

    // Rechercher le voyage par ID
    const travel = await Travel.findById(id);
    if (!travel) {
      return res.status(404).json({ success: false, message: "Travel non trouvé." });
    }

    // Envoyer le statut valide
    return res.status(200).json({ success: true, valide: travel.valide });
  } catch (error) {
    console.error("Erreur lors de la récupération du statut valide :", error);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

const getTerminatedStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Rechercher le voyage par ID
    const travel = await Travel.findById(id);
    if (!travel) {
      return res.status(404).json({ success: false, message: "Travel non trouvé." });
    }


    // Envoyer le statut `terminated`
    return res.status(200).json({ success: true, terminated: travel.terminated });
  } catch (error) {
    console.error("Erreur lors de la récupération du statut terminated :", error);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};
const updateTerminatedStatus = async (req, res) => {
  try {
    const { id,userId } = req.params;
    const agent = await User.findById(userId);
    // Rechercher le voyage par ID
 
    const travel = await Travel.findById(id).populate({
      path: 'trajetId',
      populate: ['departure', 'destination'],
    });
    if (!travel) {
      return res.status(404).json({ success: false, message: "Travel non trouvé." });
    }

    // Vérifier si le statut est déjà `true`
    if (travel.terminated) {
      return res.status(400).json({ success: false, message: "Travel est déjà terminé." });
    }

    // Mettre à jour le statut terminated en `true`
    travel.terminated = true;
    travel.agent=agent.email;

    await travel.save();
   console.log("essay",travel)
    const user = await User.findById(travel.userId);

    // Mettre à jour l'historique de l'utilisateur
const historique = await Historique.findOne({ userId: travel.userId });
if (historique) {
  historique.view=false
  historique.travel.push({
    message: 'Votre Reservation '+travel.travelId+' validé est terminé avec succès. Veuillez retrouver votre numéro de place disponible sur le ticket et veuillez vous retrouvez a la gare avant 30min .',
    departure: travel.trajetId.departure.ville,
    destination: travel.trajetId.departure.ville,
    date: travel.date,
    status: 'termine',
  });
  await historique.save();

  
}

    io.emit("travel_end", travel);
    io.emit("travel_end", historique);

    await NewSendEmail(user.email,"Reservation "+travel.travelId,'Votre Reservation '+travel.travelId+' validé est terminé avec succès. Veuillez retrouver votre numéro de place disponible sur le ticket et veuillez vous retrouvez a la gare avant 30min .');



    return res.status(200).json({ success: true, message: "Statut terminé mis à jour avec succès.", travel });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut terminated :", error);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};


const getTravels = async (req, res) => {
  try {
    const travels = await Travel.find()
      .populate("userId", "name email") // Remplit les informations de l'utilisateur
      .populate({
        path: "trajetId", // Remplit les informations du trajet
        populate: [
          { path: "departure", select: "name ville" }, // Inclut le nom et la ville de départ
          { path: "destination", select: "name ville" }, // Inclut le nom et la ville de destination
          { path: "compagnieId", select: "name image" }, 
        ]
      });

    res.status(200).json({ success: true, travels });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erreur lors de la récupération des travels." });
  }
};

const getTravel = async (req, res) => {
  try {
    const { id } = req.params;

    const travel = await Travel.findById(id)
      .populate("userId", "name email") // Remplit les informations de l'utilisateur
      .populate({
        path: "trajetId", // Remplit les informations du trajet
        populate: [
          { path: "departure", select: "name ville" }, // Inclut le nom et la ville de départ
          { path: "destination", select: "name ville" }, // Inclut le nom et la ville de destination
          { path: "compagnieId", select: "name image" }, 
        ],
        
      });

    if (!travel) {
      return res.status(404).json({ success: false, message: "Travel non trouvé." });
    }

    res.status(200).json({ success: true, travel });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erreur serveur lors de la récupération du travel." });
  }
};

const getUserDel = async (req, res) => {
  const { id, travelId } = req.params;
  console.log("Requête reçue pour user:", id, "et travel:", travelId); // Vérifier les IDs reçus

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé." });
    }
    const travel = await Travel.findById(travelId)
      .populate("userId", "name email")
      .populate({
        path: "trajetId",
        populate: [
          { path: "departure", select: "name ville" },
          { path: "destination", select: "name ville" },
          { path: "compagnieId", select: "name image" },
        ],
      });

    if (!travel) {
      return res.status(404).json({ success: false, message: "Travel non trouvé." });
    }
    const user2 = await User.findById(travel.userId);

    // Vérification de l'historique utilisateur
    const historique = await Historique.findOne({ userId: travel.userId });
    if (historique) {
      historique.view = false;
      historique.travel.push({
        message: `Voyage ${travel._id} supprimé par ${user.name} (${user._id})`,
        departure: travel.trajetId.departure.ville,
        destination: travel.trajetId.destination.ville,
        date: travel.date,
        status: "supprimer",
        del_user: user._id,
        del_name: user.name,
      });
      await historique.save();
    }
    io.emit("statut_remove", travel); 
    // Emission pour synchronisation temps réel, si nécessaire

    await NewSendEmail(user2.email,"Reservation "+travel.travelId,'Votre Voyage est supprimer par E travel Application service');




    console.log("historique :", historique);
    console.log("Historique mis à jour");

    return res.status(200).json({
      success: true,
      message: "travel récupéré avant suppression",
      travel,
    });
  } catch (error) {
    console.error("Erreur dans getUserDel:", error);
    return res.status(500).json({ success: false, error: "Erreur interne du serveur" });
  }
};



const updatePayedStatus = async (req, res) => {
  try {
      const { id} = req.params; // Récupération de l'ID depuis les paramètres de l'URL
      
      // Vérifier si le travel existe
      const travel = await Travel.findById(id);
      if (!travel) {
          return res.status(404).json({ message: "Voyage non trouvé" });
      }
      
      // Mise à jour du champ payed à true
      travel.payed = true;
      await travel.save();
      io.emit("travel_payed",travel);

      res.status(200).json({ message: "Le voyage a été payé avec succès", travel });
  } catch (error) {
      res.status(500).json({ message: "Erreur du serveur", error: error.message });
  }
};


const updateTravel = async (req, res) => {
  try {
    const { id } = req.params; // ID du Travel à mettre à jour
    const updates = req.body; // Données provenant du formulaire

    // Rechercher le Travel par ID
    const travel = await Travel.findById(id);
    if (!travel) {
      return res.status(404).json({ success: false, message: "Travel non trouvé." });
    }

    // Mise à jour des champs généraux
    if (updates.date) travel.date = updates.date;
    if (updates.name) travel.name = updates.name;
    if (updates.time) travel.time = updates.time;
    if (updates.nombre) travel.nombre = updates.nombre;
    if (updates.compagnie) travel.compagnie = updates.compagnie;
    if (updates.trajetId) travel.trajetId = updates.trajetId; // Ajout pour trajetId
    if (updates.statut) travel.statut = updates.statut; // Ajout pour trajetId

    // Mettre à jour le champ `updateAt`
    travel.updateAt = Date.now();

    // Sauvegarder les modifications
    const updatedTravel = await travel.save();
    io.emit("updated", travel); // Emission pour synchronisation temps réel, si nécessaire

    return res.status(200).json({
      success: true,
      message: "Travel mis à jour avec succès.",
      travel: updatedTravel,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Erreur serveur lors de la mise à jour du travel." });
  }
};



const updateTravelPayed = async (req, res) => {
  try {
    const { id } = req.params; // ID du Travel à mettre à jour
    const updates = req.body; // Données provenant du formulaire

    // Rechercher le Travel par ID
    const travel = await Travel.findById(id).populate({
      path: 'trajetId',
      populate: ['departure', 'destination'],
    });;
    if (!travel) {
      return res.status(404).json({ success: false, message: "Travel non trouvé." });
    }

    const user = await User.findById(travel.userId);
    // Mise à jour des champs généraux
    if (updates.date) travel.date = updates.date;
    if (updates.name) travel.name = updates.name;
    if (updates.time) travel.time = updates.time;
    if (updates.nombre) travel.nombre = updates.nombre;
    if (updates.compagnie) travel.compagnie = updates.compagnie;
    if (updates.trajetId) travel.trajetId = updates.trajetId; // Ajout pour trajetId
    if (updates.statut) travel.statut = updates.statut; // Ajout pour trajetId

    // Mettre à jour le champ `updateAt`
    travel.updateAt = Date.now();
    travel.payed = true;
    // Sauvegarder les modifications
    const updatedTravel = await travel.save();


    // Mettre à jour l'historique de l'utilisateur
const historique = await Historique.findOne({ userId: travel.userId });
if (historique) {
  historique.view=false

  historique.travel.push({
    message: 'Payement effecutué avec succès pour la reservation '+travel.travelId+' Veuillez suivre s"il vous plait l"evolution de votre billet jusqu" à la terminaison .',
    departure: travel.trajetId.departure.ville,
    destination: travel.trajetId.departure.ville,
    date: travel.date,
    status: 'payed',
  });
  await historique.save();
}
    io.emit("updated", travel); // Emission pour synchronisation temps réel, si nécessaire

    io.emit("travel_end", travel);
    io.emit("travel_end", historique);

    await NewSendEmail(user.email,"Reservation "+travel.travelId,'Payement effecutué avec succès pour la reservation '+travel.travelId+' Veuillez suivre s"il vous plait l"evolution de votre billet jusqu" à la terminaison .');

    return res.status(200).json({
      success: true,
      message: "Travel mis à jour avec succès.",
      travel: updatedTravel,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Erreur serveur lors de la mise à jour du travel." });
  }
};





const deleteTravel = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.params; 

    
 const travel = await Travel.findByIdAndDelete(id); // Supprime directement
// Mettre à jour l'historique de l'utilisateur
/*
    if (!travel) {
      return res.status(404).json({ success: false, message: "Travel non trouvé." });
    }*/

    io.emit("statut_remove", travel); // Emission pour synchronisation temps réel, si nécessaire
    
    return res.status(200).json({ success: true, message: "Travel supprimé avec succès." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erreur serveur lors de la suppression du travel." });
  }
};
const getTravelsByUserCity = async (req, res) => {
  try {
    // Récupérer l'ID de l'utilisateur depuis les paramètres de la requête
    const userId = req.user._id;
    const compagnie = req.user.compagnie;
    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé." });
    }

    // Rechercher les voyages réservés par cet utilisateur
    const userTravels = await Travel.find({ userId: userId }) // Filtrer par userId
      .populate({
        path: "trajetId",
        populate: [
          { path: "departure", select: "name ville" },
          { path: "destination", select: "name ville" },
          { path: "compagnieId", select: "name image" }, 

        ],
      });

    // Rechercher les travels où la ville de départ correspond à user.ville et compagnie
    const departureMatches = await Travel.find({ compagnie: compagnie })
      .populate({
        path: "trajetId",
        populate: [
          { path: "departure", select: "name ville" },
          { path: "destination", select: "name ville" },
        ],
      })
      .then((travels) =>
        travels.filter((travel) => travel.trajetId?.departure?.ville === user.ville)
      );

    // Combiner les résultats tout en évitant les doublons
    const allTravels = [...userTravels, ...departureMatches].filter(
      (value, index, self) =>
        index === self.findIndex((t) => t._id.toString() === value._id.toString())
    );

    // Répondre avec les données combinées
    return res.status(200).json({
      success: true,
      message: "Voyages récupérés avec succès.",
      travels: allTravels,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des voyages :", error);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};


//   
const getTravelsByUser = async (req, res) => {
  try {
    // Récupérer l'ID de l'utilisateur depuis les paramètres de la requête
  
    const { id } = req.params;

    // Vérifier que l'utilisateur existe
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé." });
    }

    // Trouver les voyages réservés par cet utilisateur
    const travels = await Travel.find({ userId: id }) // Filtrer par userId
      .populate({
        path: "trajetId",
        populate: [
          { path: "departure", select: "name ville" },
          { path: "destination", select: "name ville" },
          { path: "compagnieId", select: "name image" }, 

        ],
      });

    // Répondre avec les données
    return res.status(200).json({
      success: true,
      message: "Voyages récupérés avec succès.",
      travels: travels,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des voyages :", error);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};


const getTravelStatsByUser = async (req, res) => {
  try {
    const userId = req.user._id;

    // Convertir userId en ObjectId pour éviter les erreurs
    const objectIdUserId = new mongoose.Types.ObjectId(userId);

    // Vérifier que l'utilisateur existe
    const user = await User.findById(objectIdUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé." });
    }

    const totalVoyages = await Travel.countDocuments({ userId: objectIdUserId, terminated: false });

    // Vérification des voyages non effectués (terminated: false)
    const totalEffectues = await Travel.countDocuments({
      userId: objectIdUserId,
      terminated: true,
    });
    const totalBudget = await Travel.aggregate([
      { $match: { userId: objectIdUserId } }, // Correctement associer à ObjectId
      { $group: { _id: null, totalPrice: { $sum: "$priceTotal" } } },
    ]);

    // Calculer le totalBudget
    const budgetEffectue = totalBudget.length > 0 ? totalBudget[0].totalPrice : 0;

    // Répondre avec les statistiques
    return res.status(200).json({
      success: true,
      data: {
        totalVoyages,
        totalEffectues,
        budgetEffectue,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques de voyage :", error);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

const updateTravelStatut = async (req, res) => {
  try {
    const { id } = req.params; // ID du voyage
    const { statut } = req.body; // Texte du statut passé depuis le frontend

    // Vérifier si l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "ID invalide." });
    }

    const travel = await Travel.findById(id).populate({
      path: 'trajetId',
      populate: ['departure', 'destination'],
    });

    if (!travel) {
      return res.status(404).json({ success: false, message: "Voyage non trouvé." });
    }

    // Mettre à jour le champ `statut`
    travel.statut = statut;
    await travel.save();
    const user = await User.findById(travel.userId);


    // Mettre à jour l'historique de l'utilisateur
const historique = await Historique.findOne({ userId: travel.userId });
if (historique) {
  historique.view=false
  historique.travel.push({
    message: 'Demande de disponibilté du compagnie '+travel.compagnie+ ' concernant votre reservation '+travel.travelId+': Veuillez revoir votre reservation et acceptez  ou annuler la reservation disponible. Payer  le billet en acceptant ces nouvelles options disponible pour votre billet de reservation, rendez vous sur votre ticket en cours de traitement',
    departure: travel.trajetId.departure.ville,
    destination: travel.trajetId.destination.ville,
    date: travel.date,
    status: 'demande',
  });
  await historique.save();
}


    io.emit("statut_updated", travel); // Emission pour synchronisation temps réel, si nécessaire
    io.emit("statut_updated", historique); // Emission pour synchronisation temps réel, si nécessaire

    await NewSendEmail(user.email,"Reservation "+travel.travelId,'Demande de disponibilté du compagnie '+travel.compagnie+ ' concernant votre reservation '+travel.travelId+': Veuillez revoir votre reservation et acceptez  ou annuler la reservation disponible. Payer  le billet en acceptant ces nouvelles options disponible pour votre billet de reservation, rendez vous sur votre ticket en cours de traitement');




    return res.status(200).json({
      success: true,
      message: "Statut mis à jour avec succès.",
      travel,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut :", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur.",
    });
  }
};


const updateTravelStatutPayed = async (req, res) => {
  try {
    const { id } = req.params; // ID du voyage
    const { statut } = req.body; // Texte du statut passé depuis le frontend

    // Vérifier si l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "ID invalide." });
    }

    const travel = await Travel.findById(id).populate({
      path: 'trajetId',
      populate: ['departure', 'destination'],
    });

    if (!travel) {
      return res.status(404).json({ success: false, message: "Voyage non trouvé." });
    }
    const user = await User.findById(travel.userId);

    // Mettre à jour le champ `statut`
    travel.statut = statut;
    await travel.save();


    // Mettre à jour l'historique de l'utilisateur
const historique = await Historique.findOne({ userId: travel.userId });
if (historique) {
  historique.view=false
  historique.travel.push({
    message: 'Demande de payement au compagnie '+travel.compagnie+ ' concernant votre reservation '+travel.travelId+': Veuillez SVP effectuer le depot en continuant la procedure de terminaison du billet de reservation , Rendez de vous sur votre ticket. ATTENTION SANS EFFECTUER LE DEPOT VOTRE BILLET NE SERA PAS ENREGISTRE ET RISQUE D" ETRE ANNULÉ',
    departure: travel.trajetId.departure.ville,
    destination: travel.trajetId.destination.ville,
    date: travel.date,
    status: 'demande',
  });
  await historique.save();
}



    io.emit("statut_updated", travel); // Emission pour synchronisation temps réel, si nécessaire
    io.emit("statut_updated", historique); // Emission pour synchronisation temps réel, si nécessaire
    await NewSendEmail(user.email,"Reservation "+travel.travelId,'Demande de payement au compagnie '+travel.compagnie+ ' concernant votre reservation '+travel.travelId+': Veuillez SVP effectuer le depot en continuant la procedure de terminaison du billet de reservation , Rendez de vous sur votre ticket. ATTENTION SANS EFFECTUER LE DEPOT VOTRE BILLET NE SERA PAS ENREGISTRE ET RISQUE D" ETRE ANNULÉ');



    return res.status(200).json({
      success: true,
      message: "Statut mis à jour avec succès.",
      travel,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut :", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur.",
    });
  }
};

const getUserHistory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "L'id est requis." });
    }

    // Recherche de l'historique de l'utilisateur
    const userHistorique = await Historique.findOne({ userId: id });
    if (!userHistorique) {
      return res.status(404).json({
        success: false,
        message: "Aucun historique trouvé pour cet utilisateur.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Historique récupéré avec succès.",
      historique: userHistorique,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique :", error);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};



const updateHistoriqueView = async (req, res) => {
  try {
    const { id } = req.params; // Récupérer l'_id depuis les paramètres de la requête

    // Vérifier si l'historique existe
    const historique = await Historique.findById(id);
    if (!historique) {
      return res.status(404).json({ success: false, message: "Historique non trouvé." });
    }

    // Mettre à jour le champ "view" en true
    historique.view = true;

    // Sauvegarder les modifications
    await historique.save();

    return res.status(200).json({
      success: true,
      message: "Historique mis à jour avec succès.",
      historique,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'historique :', error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la mise à jour de l'historique.",
    });
  }
};

const updateTravelReadStatus = async (req, res) => {
  try {
    const { historiqueId, timestamp } = req.params;

    if (!historiqueId || !timestamp) {
      return res.status(400).json({ message: "historiqueId et timestamp sont requis" });
    }

    const historique = await Historique.findById(historiqueId);

    if (!historique) {
      return res.status(404).json({ message: "Historique introuvable" });
    }

    // Trouver l'index du travel correspondant
    const travelIndex = historique.travel.findIndex((item) =>
      new Date(item.timestamp).getTime() === new Date(timestamp).getTime()
    );

    if (travelIndex === -1) {
      return res.status(404).json({ message: "Élément travel introuvable" });
    }
    // Mettre à jour le champ "read"
    console.log( historique.travel[travelIndex].read);

    historique.travel[travelIndex].read = true;

    // Important : Marquer le champ "travel" comme modifié
    historique.markModified("travel");
    // Sauvegarder les modifications
    await historique.save();
    io.emit("statut_notification", historique); 

    return res.status(200).json({
      message: "Statut de lecture mis à jour avec succès",
      updatedhist: historique,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut de lecture :", error);
    return res.status(500).json({ message: "Erreur serveur", error });
  }
};



export {addTravelAgent,getUserDel, updateTravelPayed ,updateTravelStatutPayed ,updatePayedStatus,updateTravelReadStatus ,updateHistoriqueView,getUserHistory,updateTravelStatut,getTravelsByUser,getTravelStatsByUser,getTerminatedStatus,updateTerminatedStatus,getTravelsByUserCity ,addTravel,getTravels,getTravel,addPlaceToTravel,deleteTravel,updateTravel,validateTravel }





