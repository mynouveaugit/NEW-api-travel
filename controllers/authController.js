import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Chercher par email ou téléphone
    const user = await User.findOne({
      $or: [{ email: email }, { telephone: email }],
    });

    if (!user) {
      console.error("User not found for:", email);
      return res.status(404).json({ success: false, error: "User Not Found" });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.error("Password mismatch for user:", email);
      return res.status(404).json({ success: false, error: "Wrong Password" });
    }

    // Créer un token JWT
    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: "10d" }
    );
    console.log("Login successful for user:", email);

    return res.status(200).json({
      success: true,
      token,
      user: { _id: user._id, name: user.name, role: user.role,numero:user.telephone,compagnie:user.compagnie,ville:user.ville},
    });
  } catch (error) {
    console.error("Server error during login:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const verify = (req,res)=>{
  return res.status(200).json({success:true, user: req.user})
}

const updateUser = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const userId = req.user._id; // ID de l'utilisateur connecté

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
    }

    // Vérifier si l'utilisateur a entré un mot de passe actuel
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
        return res.status(400).json({ success: false, message: "Mot de passe actuel incorrect" });
        }

      // Hachage du nouveau mot de passe
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
  n      }

    // Mise à jour des autres champs
    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des informations utilisateur :", error);
    res.status(500).json({ success: false, error: error.message });
  }
};



const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email password'); // Récupère les champs requis
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }

    res.status(200).json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        password: user.password, // Inclure le mot de passe n'est pas recommandé en production
      },
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des informations utilisateur :', err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

export { login,verify,updateUser,  getUserDetails  };
