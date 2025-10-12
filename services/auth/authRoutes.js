const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../server/models/user/user');

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const secret = process.env.JWT_SECRET;

        if (!email || !password) {
            return res.status(400).json({ error: 1, response: {mensaje: 'Usuario y contraseña son requeridos'} });
        }
        if (!secret) {
            return res.status(500).json({ error: 1, response: {mensaje: 'Servidor sin JWT_SECRET configurado'} });
        }

        const user = await User.findOne({ Cr_Nombre_Usuario: email });
        if (!user) {
            return res.status(401).json({ error: 1, response: {mensaje: 'Credenciales inválidas'} });
        }

        if (user.Cr_Password !== password) {
            return res.status(401).json({ error: 1, response: {mensaje: 'Credenciales inválidas'} });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.Cr_Nombre_Usuario },
            secret,
            { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
        );

        console.log('Login OK para usuario:', user._id);
        return res.status(200).json({ error: 0, response: {mensaje: 'Login exitoso', token} });
    } catch (err) {
        console.error('Error en /login:', err);
        return res.status(500).json({ error: false, response: {mensaje: 'Error interno del servidor'} });
    }
});

module.exports = router;