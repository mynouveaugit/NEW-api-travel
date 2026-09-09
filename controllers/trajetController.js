import Trajet from "../models/Trajet.js"
import bcrypt from 'bcryptjs'
import Departement from "../models/Departement.js"
import Station from "../models/Station.js";
import TravelNone from "../models/TrajetNone.js";
import moment from "moment";

const addTrajet = async (req, res) => {
  try {
    const { departure, destination, price, hours, duree, compagnieId, stations } = req.body;

    const existingTrajet = await Trajet.findOne({ departure, destination, compagnieId });
    if (existingTrajet) {
      return res.status(400).json({
        success: false,
        message: "Un trajet avec cette departure et destination pour ce compagnie existe déjà.",
      });
    }

    // Validation des gares si fournies
    let validatedStations = [];
    if (stations && Array.isArray(stations) && stations.length > 0) {
      const foundStations = await Station.find({ _id: { $in: stations } });

      if (foundStations.length !== stations.length) {
        return res.status(400).json({
          success: false,
          message: "Une ou plusieurs gares sont introuvables.",
        });
      }

      const invalid = foundStations.some(
        (s) =>
          s.compagnieId.toString() !== compagnieId ||
          s.departementId.toString() !== departure
      );

      if (invalid) {
        return res.status(400).json({
          success: false,
          message: "Une ou plusieurs gares ne correspondent pas à la compagnie ou à la ville de départ.",
        });
      }

      validatedStations = stations;
    }

    const newTrajet = new Trajet({
      departure,
      destination,
      compagnieId,
      price,
      duree,
      stations: validatedStations,
    });

    await newTrajet.save();
    return res.status(200).json({ success: true, message: "Trajet créé avec succès." });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Erreur serveur lors de l'ajout du trajet." });
  }
};

// Ajouter une gare à un trajet existant
const addStationToTrajet = async (req, res) => {
  try {
    const { id } = req.params; // ID du trajet
    const { stationId } = req.body;

    if (!stationId) {
      return res.status(400).json({ success: false, message: "L'ID de la gare est requis." });
    }

    const trajet = await Trajet.findById(id);
    if (!trajet) {
      return res.status(404).json({ success: false, message: "Trajet non trouvé." });
    }

    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({ success: false, message: "Gare non trouvée." });
    }

    // Vérifier que la gare correspond à la compagnie du trajet
    if (station.compagnieId.toString() !== trajet.compagnieId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cette gare n'appartient pas à la compagnie de ce trajet.",
      });
    }

    // Vérifier que la gare correspond au département de départ du trajet
    if (station.departementId.toString() !== trajet.departure.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cette gare ne correspond pas à la ville de départ de ce trajet.",
      });
    }

    // Vérifier si la gare est déjà associée
    const isDuplicate = trajet.stations.some((s) => s.toString() === stationId);
    if (isDuplicate) {
      return res.status(400).json({
        success: false,
        message: "Cette gare est déjà associée à ce trajet.",
      });
    }

    trajet.stations.push(stationId);
    trajet.updateAt = Date.now();
    await trajet.save();

    const updatedTrajet = await Trajet.findById(id).populate('stations');

    return res.status(200).json({
      success: true,
      message: "Gare ajoutée au trajet avec succès.",
      trajet: updatedTrajet,
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout de la gare au trajet :", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'ajout de la gare au trajet.",
    });
  }
};

// Retirer une gare d'un trajet
const removeStationFromTrajet = async (req, res) => {
  try {
    const { id, stationId } = req.params;

    const trajet = await Trajet.findById(id);
    if (!trajet) {
      return res.status(404).json({ success: false, message: "Trajet non trouvé." });
    }

    trajet.stations = trajet.stations.filter((s) => s.toString() !== stationId);
    trajet.updateAt = Date.now();
    await trajet.save();

    return res.status(200).json({
      success: true,
      message: "Gare retirée du trajet avec succès.",
      trajet,
    });
  } catch (error) {
    console.error("Erreur lors du retrait de la gare :", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors du retrait de la gare.",
    });
  }
};

const addHourToTrajet = async (req, res) => {
  try {
    const { id } = req.params;
    let { time } = req.body;

    const timeMatch = time.match(/^(\d{1,2}):(\d{2})$/);
    if (!timeMatch) {
      return res.status(400).json({
        success: false,
        message: `L'heure est invalide : ${time}. Le format attendu est HH:mm.`,
      });
    }

    let [_, hours, minutes] = timeMatch;
    hours = parseInt(hours, 10);
    minutes = parseInt(minutes, 10);

    if (hours < 0 || hours > 23) {
      return res.status(400).json({
        success: false,
        message: `L'heure doit être comprise entre 00 et 23.`,
      });
    }
    if (minutes < 0 || minutes > 59) {
      return res.status(400).json({
        success: false,
        message: `Les minutes doivent être comprises entre 00 et 59.`,
      });
    }

    hours = hours.toString().padStart(2, '0');
    minutes = minutes.toString().padStart(2, '0');
    time = `${hours}:${minutes}`;

    const trajet = await Trajet.findById(id);
    if (!trajet) {
      return res.status(404).json({ success: false, message: 'Trajet non trouvé.' });
    }

    const isDuplicate = trajet.hours.some((h) => h.time === time);
    if (isDuplicate) {
      return res.status(400).json({
        success: false,
        message: `L'heure ${time} existe déjà pour ce trajet.`,
      });
    }

    trajet.hours.push({ time });
    await trajet.save();

    return res.status(200).json({
      success: true,
      message: 'Heure ajoutée avec succès.',
      trajet,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Erreur serveur lors de l'ajout de l'heure." });
  }
};

const getTrajets = async (req, res) => {
  try {
    const trajets = await Trajet.find()
      .populate('departure', 'ville')
      .populate('destination', 'ville')
      .populate('compagnieId', 'name image')
      .populate('stations', 'name latitude longitude');

    res.status(200).json({
      success: true,
      Trajets: trajets,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des trajets:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des trajets.',
    });
  }
};

const getAppTrajets = async (req, res) => {
  try {
    const { compagnie } = req.body;

    if (!compagnie) {
      return res.status(400).json({
        success: false,
        error: 'Le champ compagnie est requis.',
      });
    }

    const trajets = await Trajet.find({})
      .populate('departure', 'ville')
      .populate('destination', 'ville')
      .populate('stations', 'name latitude longitude')
      .populate({
        path: 'compagnieId',
        select: 'name image',
        match: { name: compagnie },
      });

    const filteredTrajets = trajets.filter((trajet) => trajet.compagnieId);

    res.status(200).json({
      success: true,
      Trajets: filteredTrajets,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des trajets:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des trajets.',
    });
  }
};

const getTrajet = async (req, res) => {
  try {
    const { id } = req.params;
    const trajet = await Trajet.findById(id)
      .populate({
        path: 'departure',
        select: 'name ville country',
      })
      .populate({
        path: 'destination',
        select: 'name ville country',
      })
      .populate({
        path: 'compagnieId',
        select: 'name image',
      })
      .populate({
        path: 'stations',
        select: 'name latitude longitude',
      });

    if (!trajet) {
      return res.status(404).json({ success: false, message: 'Trajet non trouvé.' });
    }

    return res.status(200).json({ success: true, trajet });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

const updateTrajet = async (req, res) => {
  try {
    const { id } = req.params;
    const { departure, destination, price, hours, duree, compagnieId, days, stations } = req.body;

    const trajet = await Trajet.findById(id);
    if (!trajet) {
      return res.status(404).json({ success: false, message: "Trajet non trouvé." });
    }

    if (days) {
      if (!Array.isArray(days) || days.some((day) => typeof day !== "number" || day < 0 || day > 6)) {
        return res.status(400).json({
          success: false,
          message: "La liste des jours est invalide. Elle doit contenir des nombres entre 0 et 6.",
        });
      }

      trajet.days = days.map((day) => ({ date: day }));
    }

    if (departure) trajet.departure = departure;
    if (destination) trajet.destination = destination;
    if (price) trajet.price = price;
    if (duree) trajet.duree = duree;
    if (compagnieId) trajet.compagnieId = compagnieId;

    // Validation et mise à jour des gares
    if (stations && Array.isArray(stations)) {
      const targetCompagnieId = compagnieId || trajet.compagnieId;
      const targetDeparture = departure || trajet.departure;

      if (stations.length > 0) {
        const foundStations = await Station.find({ _id: { $in: stations } });

        if (foundStations.length !== stations.length) {
          return res.status(400).json({
            success: false,
            message: "Une ou plusieurs gares sont introuvables.",
          });
        }

        const invalid = foundStations.some(
          (s) =>
            s.compagnieId.toString() !== targetCompagnieId.toString() ||
            s.departementId.toString() !== targetDeparture.toString()
        );

        if (invalid) {
          return res.status(400).json({
            success: false,
            message: "Une ou plusieurs gares ne correspondent pas à la compagnie ou à la ville de départ.",
          });
        }
      }

      trajet.stations = stations;
    }

    if (hours && Array.isArray(hours)) {
      const validHours = hours.filter(({ time }) => {
        const match = /^(\d{2}):(\d{2})$/.exec(time);
        if (!match) return false;
        const [_, hour, minute] = match.map(Number);
        return hour >= 0 && hour < 24 && minute >= 0 && minute < 60;
      });

      if (validHours.length !== hours.length) {
        return res.status(400).json({
          success: false,
          message:
            "Certaines heures sont invalides. Assurez-vous que les heures sont au format HH:mm.",
        });
      }

      trajet.hours = validHours;
    }

    trajet.updateAt = Date.now();

    const updatedTrajet = await trajet.save();

    return res.status(200).json({
      success: true,
      message: "Trajet mis à jour avec succès.",
      trajet: updatedTrajet,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du trajet :", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la mise à jour du trajet.",
    });
  }
};

const deleteTrajet = async (req, res) => {
  try {
    const { id } = req.params;

    const trajet = await Trajet.findById(id);
    if (!trajet) {
      return res.status(404).json({ success: false, message: "Trajet non trouvé." });
    }

    await Trajet.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Trajet supprimé avec succès.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la suppression du trajet.",
    });
  }
};

const addDayToTrajet = async (req, res) => {
  try {
    const { id } = req.params;
    const { day } = req.body;

    if (typeof day !== "number" || day < 0 || day > 6) {
      return res.status(400).json({
        success: false,
        message: "Le jour est invalide. Il doit être un nombre compris entre 0 et 6.",
      });
    }

    const trajet = await Trajet.findById(id);
    if (!trajet) {
      return res.status(404).json({ success: false, message: "Trajet non trouvé." });
    }

    const isDuplicate = trajet.days.some((d) => d.date === day);
    if (isDuplicate) {
      return res.status(400).json({
        success: false,
        message: `Le jour ${day} existe déjà pour ce trajet.`,
      });
    }

    trajet.days.push({ date: day });
    await trajet.save();

    return res.status(200).json({
      success: true,
      message: "Jour ajouté avec succès.",
      trajet,
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout du jour :", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'ajout du jour.",
    });
  }
};

export const addTravelNone = async (req, res) => {
  try {
      const { date, time, trajetId, compagnie } = req.body;

      if (!date || !time || !trajetId || !compagnie) {
          return res.status(400).json({ message: "Tous les champs obligatoires doivent être remplis." });
      }

      const existingTravel = await TravelNone.findOne({ date, time, trajetId, compagnie });

      if (existingTravel) {
          return res.status(409).json({ message: "Un trajet avec ces informations existe déjà." });
      }

      const newTravel = new TravelNone({ date, time, trajetId, compagnie });

      await newTravel.save();
      console.log("Objet enregistré :", newTravel);

      return res.status(201).json({ success: true, message: "Trajet indisponible ajouté avec succès." });

  } catch (error) {
      console.error("Erreur lors de l'ajout du Travel:", error);
      return res.status(500).json({ message: "Erreur serveur" });
  }
};

export const deleteTravelNone = async (req, res) => {
    try {
        const { id } = req.params;

        const travel = await TravelNone.findById(id);

        if (!travel) {
            return res.status(404).json({ message: "Travel introuvable" });
        }

        await TravelNone.findByIdAndDelete(id);
        
        res.status(200).json({ message: "Travel supprimé avec succès", success: true });
    } catch (error) {
        console.error("Erreur lors de la suppression du Travel:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

export const getAllTravelNone = async (req, res) => {
  try {
      const travels = await TravelNone.find().populate({
        path: "trajetId",
        populate: [
          { path: "departure", select: "name ville" },
          { path: "destination", select: "name ville" },
          { path: "compagnieId", select: "name image" },
        ],
      });
      res.status(200).json({ success: true, travels });

  } catch (error) {
      console.error("Erreur lors de la récupération des Travels:", error);
      res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const getTravelNone = async (req, res) => {
  try {
      const { date, time, trajetId, compagnie } = req.query;

      if (!date || !time || !trajetId || !compagnie) {
          return res.status(400).json({ message: "Tous les champs obligatoires doivent être fournis." });
      }

      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
          return res.status(400).json({ message: "Format de date invalide." });
      }

      const startOfDay = moment(dateObj).startOf('day').toDate();
      const endOfDay = moment(dateObj).endOf('day').toDate();

      const travel = await TravelNone.findOne({
          date: { $gte: startOfDay, $lt: endOfDay },
          time,
          trajetId,
          compagnie
      });
      console.log(travel)
      if (!travel) {
          return res.status(404).json({ message: "Aucun trajet indisponible trouvé." });
      }

      res.status(200).json({ success: true, travel });
  } catch (error) {
      console.error("Erreur lors de la récupération du TravelNone:", error);
      return res.status(500).json({ message: "Erreur serveur" });
  }
};

const getAllTrajetsApp = async (req, res) => {
  try {
    const trajets = await Trajet.find()
      .populate('departure', 'ville name')
      .populate('destination', 'ville name')
      .populate('compagnieId', 'name image')
      .populate('stations', 'name latitude longitude');

    return res.status(200).json({ success: true, Trajets: trajets });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export { getAllTrajetsApp };

export {
  addDayToTrajet,
  getAppTrajets,
  addTrajet,
  getTrajets,
  getTrajet,
  addHourToTrajet,
  updateTrajet,
  deleteTrajet,
  addStationToTrajet,
  removeStationFromTrajet,
};