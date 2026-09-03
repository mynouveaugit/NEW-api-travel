

import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import {addTravelAgent,getUserDel,updateTravelPayed , updateTravelStatutPayed ,updateTravelReadStatus,updateHistoriqueView,getUserHistory,updateTravelStatut,getTravelStatsByUser,getTravelsByUserCity,getTravels,addTravel,getTravel,addPlaceToTravel,validateTravel,deleteTravel,updateTravel, updateTerminatedStatus,getTerminatedStatus,getTravelsByUser} from '../controllers/travelController.js'

const router = express.Router()

router.get('/',authMiddleware,getTravels);
router.get('/app/:id',getTravelsByUser);
router.get('/hist/:id',getUserHistory);
router.get('/sell',authMiddleware,getTravelsByUserCity)
router.get('/term/:id',authMiddleware,getTerminatedStatus)
router.get('/sellstat',authMiddleware,getTravelStatsByUser);
router.post('/add',authMiddleware,addTravelAgent);
router.post('/add/app',addTravel);
router.get('/:id',authMiddleware,getTravel);
router.get('/del/:id/:travelId',getUserDel);
router.post('/addplace/:id',authMiddleware,addPlaceToTravel)
router.get('/validate/:id',authMiddleware,validateTravel )
router.delete('/:id',authMiddleware,deleteTravel)
router.delete('/app/:id',deleteTravel)
router.put('/app/:id',updateTravelPayed )
router.put('/:id',updateTravel )
router.put('/term/:id/:userId',authMiddleware,updateTerminatedStatus)
router.put('/statut/:id',authMiddleware,updateTravelStatut)
router.put('/updatehist/:id',updateHistoriqueView)
router.put('/update/:historiqueId/travel/:timestamp/read', updateTravelReadStatus);
router.put('/payedstatut/:id',authMiddleware,updateTravelStatutPayed )





//getView 


/*
router.put('/:id',authMiddleware,updateTrajet)


/*
*/

/*
//router.delete('/:id',authMiddleware,deleteDepartment)
*/


export default router










