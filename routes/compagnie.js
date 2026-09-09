import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import { addCompagnie,getCompagnies,getCompagnie,upload ,deleteCompagnie, editCompagnie, } from '../controllers/compagnieController.js'
import { addStation, getStations, getStationsByCompagnie, getStationsByCompagnieAndDepartement, getStation, editStation, deleteStation } from '../controllers/compagnieController.js'

const router = express.Router()

router.get('/',authMiddleware,getCompagnies)
router.get('/app',getCompagnies)
router.get('/:id',authMiddleware,getCompagnie)
router.post('/add', authMiddleware, upload.single('image'), addCompagnie);
router.put('/:id', authMiddleware, upload.single('image'), editCompagnie);
router.delete('/:id',authMiddleware,deleteCompagnie)

// Routes Station
router.post('/station/add', authMiddleware, addStation);
router.get('/station/all', authMiddleware, getStations);
router.get('/station/compagnie/:compagnieId', authMiddleware, getStationsByCompagnie);
router.get('/station/compagnie/:compagnieId/departement/:departementId', authMiddleware, getStationsByCompagnieAndDepartement);
router.get('/station/:id', authMiddleware, getStation);
router.put('/station/:id', authMiddleware, editStation);
router.delete('/station/:id', authMiddleware, deleteStation);

export default router