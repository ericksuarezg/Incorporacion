// Archivo: authRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../server/models/user/user');

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { email: emailPlain, password: passwordPlain } = req.body;
        const secret = process.env.JWT_SECRET;

        if (!emailPlain || !passwordPlain) {
            return res.status(400).json({ error: 1, response: { mensaje: 'Usuario y contraseña son requeridos' } });
        }
        if (!secret) {
            return res.status(500).json({ error: 1, response: { mensaje: 'Servidor sin JWT_SECRET configurado' } });
        }

        const user = await User.findOne({
            $or: [{ Cr_Nombre_Usuario: emailPlain }, { email: emailPlain }]
        });
        if (!user) {
            return res.status(401).json({ error: 1, response: { mensaje: 'Credenciales inválidas' } });
        }

        const hash = user.Cr_Password;

        if (!hash) {
            console.warn('Usuario sin hash bcrypt en BD:', user._id);
            return res.status(500).json({ error: 1, response: { mensaje: 'Cuenta sin hash bcrypt configurado' } });
        }

        let verified = false;
        try {
            verified = await bcrypt.compare(passwordPlain, hash);
        } catch (e) {
            console.error('Error comparando contraseña con bcrypt:', e);
            return res.status(500).json({ error: 1, response: { mensaje: 'Error verificando credenciales' } });
        }

        if (!verified) {
            return res.status(401).json({ error: 1, response: { mensaje: 'Credenciales inválidas' } });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.Cr_Nombre_Usuario || user.email },
            secret,
            { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
        );

        console.log('Login OK para usuario:', user._id);
        return res.status(200).json({ error: 0, response: { mensaje: 'Login exitoso', token } });
    } catch (err) {
        console.error('Error en /login:', err);
        return res.status(500).json({ error: 1, response: { mensaje: 'Error interno del servidor' } });
    }
});

module.exports = router;
