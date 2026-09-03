import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import { updateUserPass,getUserByEmail ,getAllHistoriques,verifyUser, getView,addUser,getUsers,getUser,updateUser,deleteUser,markUserAsViewed 
} from '../controllers/userController.js'
const router = express.Router()
router.get('/',authMiddleware,getUsers)
router.get('/historiques',authMiddleware,getAllHistoriques)
router.post("/verify", verifyUser);
router.get('/view/:id',authMiddleware,getView)
router.post('/add/app',addUser)
router.post('/add',authMiddleware,addUser)
router.get('/:id',authMiddleware,getUser)
router.put('/:id',authMiddleware,updateUser)
router.put('/app/:id',updateUserPass)
router.delete('/:id',authMiddleware,deleteUser)
router.put('/view/:id',authMiddleware,markUserAsViewed)
router.get('/email/:email',getUserByEmail)


/*
//router.delete('/:id',authMiddleware,deleteDepartment)
*/


export default router
