

import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import {getUnpaidTravels,getTerminatedTravels,getTotalUsers,getTotalDepartements,getTotalPriceCurrentMonth, getTotalVoyagesPlanned ,getAverageParticipants,getDelayedTravels,getTopDestination} from '../controllers/dataStatController.js'
const router = express.Router()

// Route pour le nombre total d'utilisateurs
router.get('/total-users', getTotalUsers);

// Route pour le nombre total de départements
router.get('/total-departements', getTotalDepartements);

// Route pour le total des prix des voyages du mois en cours
router.get('/total-price-month', getTotalPriceCurrentMonth);

router.get('/total-voyages-planned', getTotalVoyagesPlanned);
router.get('/average-participants', getAverageParticipants);
router.get('/delayed-travels', getDelayedTravels);
router.get('/top-destination', getTopDestination);
router.get('/voyages-termine',getTerminatedTravels);
router.get('/voyages-nonpayed',getUnpaidTravels);


export default router












