import Trajet from "../models/Trajet.js"
import bcrypt from 'bcryptjs'
import Departement from "../models/Departement.js"
import User from "../models/User.js"
import Travel from "../models/Travel.js"

const getTotalUsers = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    res.status(200).json({ success: true, totalUsers });
  } catch (err) {
    console.error('Erreur lors du comptage des utilisateurs :', err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};



const getTotalDepartements = async (req, res) => {
  try {
    const totalDepartements = await Departement.countDocuments();
    res.status(200).json({ success: true, totalDepartements });
  } catch (err) {
    console.error('Erreur lors du comptage des départements :', err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};


const getTotalPriceCurrentMonth = async (req, res) => {
  try {
    const { month, year, compagnie } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const filter = {
      date: { $gte: startDate, $lte: endDate },
    };

    if (compagnie) {
      filter.compagnie = compagnie;
    }

    const totalPrice = await Travel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: "$priceTotal" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      totalPrice: totalPrice[0]?.total || 0,
    });
  } catch (err) {
    console.error("Erreur lors du calcul des prix des voyages :", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

const getTerminatedTravels = async (req, res) => {
  try {
    const { month, year, compagnie } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const filter = {
      date: { $gte: startDate, $lte: endDate },
      payed: true,
      terminated: true,
    };
    
    if (compagnie) {
      filter.compagnie = compagnie;
    }

    const terminatedTravels = await Travel.countDocuments(filter);
    res.status(200).json({ success: true, terminatedTravels });
  } catch (err) {
    console.error("Erreur lors du comptage des voyages terminés :", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

const getTotalVoyagesPlanned = async (req, res) => {
  try {
    const { month, year, compagnie } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const filter = {
      date: { $gte: startDate, $lte: endDate },
      payed: true,
      terminated: false, // 🔹 Ajout de cette condition
    };
    
    if (compagnie) {
      filter.compagnie = compagnie;
    }

    const totalVoyages = await Travel.countDocuments(filter);
    res.status(200).json({ success: true, totalVoyages });
  } catch (err) {
    console.error("Erreur lors du comptage des voyages planifiés :", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};


const getAverageParticipants = async (req, res) => {
  try {
    const { month, year, compagnie } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const filter = {
      date: { $gte: startDate, $lte: endDate },
      payed: true,
    };
    
    if (compagnie) {
      filter.compagnie = compagnie;
    }

    const voyages = await Travel.find(filter);
    const totalParticipants = voyages.reduce((sum, v) => sum + v.nombre, 0);
    const averageParticipants = voyages.length ? totalParticipants / voyages.length : 0;

    res.status(200).json({ success: true, averageParticipants });
  } catch (err) {
    console.error("Erreur lors du calcul de la moyenne des participants :", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};


const getDelayedTravels = async (req, res) => {
  try {
    const { month, year, compagnie } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const currentDate = new Date();
    const filter = {
      date: { $gte: startDate, $lte: endDate, $lt: currentDate },
      payed: true,
    };
    

    if (compagnie) {
      filter.compagnie = compagnie;
    }

    const delayedTravels = await Travel.countDocuments(filter);
    res.status(200).json({ success: true, delayedTravels });
  } catch (err) {
    console.error("Erreur lors du comptage des voyages retardés :", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

const getTopDestination = async (req, res) => {
  try {
    const { month, year, compagnie } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const filter = {
      date: { $gte: startDate, $lte: endDate },
      payed: true,
    };

    if (compagnie) {
      filter.compagnie = compagnie;
    }

    const result = await Travel.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "trajets", // Nom de la collection des trajets
          localField: "trajetId",
          foreignField: "_id",
          as: "trajet",
        },
      },
      { $unwind: "$trajet" }, // Convertit le tableau en objet unique
      {
        $lookup: {
          from: "departements", // Nom de la collection des départements
          localField: "trajet.destination",
          foreignField: "_id",
          as: "destination",
        },
      },
      { $unwind: "$destination" }, // Convertit le tableau en objet unique
      {
        $group: {
          _id: "$destination.ville", // Regroupement par ville de destination
          count: { $sum: 1 }, // Comptage du nombre de voyages
        },
      },
      { $sort: { count: -1 } }, // Tri par nombre décroissant
      { $limit: 1 }, // Récupérer uniquement la destination la plus populaire
    ]);

    const topDestination = result[0]?._id || "Aucune donnée";

    res.status(200).json({ success: true, topDestination });
  } catch (err) {
    console.error("Erreur lors de la récupération de la destination populaire :", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

const getUnpaidTravels = async (req, res) => {
  try {
    const { month, year, compagnie } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const filter = {
      date: { $gte: startDate, $lte: endDate },
      payed: false,
    };

    if (compagnie) {
      filter.compagnie = compagnie;
    }

    const unpaidTravels = await Travel.countDocuments(filter);

    console.log("je suis ici",unpaidTravels)
    res.status(200).json({ success: true, unpaidTravels });
  } catch (err) {
    console.error("Erreur lors du comptage des voyages impayés :", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

export {getUnpaidTravels,getTerminatedTravels, getTotalUsers,getTotalDepartements,getTotalPriceCurrentMonth, getTotalVoyagesPlanned ,getAverageParticipants,getDelayedTravels,getTopDestination}





