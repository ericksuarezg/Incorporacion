const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const IPS = require('../server/models/ips/ips');

router.post('/crearIps', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'] || req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 1, response: { mensaje: 'Token requerido' } });
        }

        const token = authHeader.substring(7);
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ error: 1, response: { mensaje: 'Servidor sin JWT_SECRET configurado' } });
        }

        try {
            jwt.verify(token, secret);
        } catch (e) {
            return res.status(401).json({ error: 1, response: { mensaje: 'Token inválido o expirado' } });
        }

        const data = req.body;

        if (!data.NOMBRE_IPS || data.NOMBRE_IPS.trim() === '') {
            return res.status(400).json({ error: 1, response: { mensaje: 'Se debe enviar el nombre de la IPS' } });
        }

        
        const existente = await IPS.findOne({ NOMBRE_IPS: data.NOMBRE_IPS.trim() }).lean();
        if (existente) {
            return res.status(409).json({
                error: 1,
                response: { mensaje: `La IPS '${data.NOMBRE_IPS}' ya está registrada` }
            });
        }

        
        const nuevaIPS = await IPS.create({
            NOMBRE_IPS: data.NOMBRE_IPS.trim(),
            NIT: data.NIT || '',
            DIRECCION: data.DIRECCION || '',
            TELEFONO: data.TELEFONO || '',
            CORREO: data.CORREO || '',
            REPRESENTANTE: data.REPRESENTANTE || '',
            CIUDAD: data.CIUDAD || '',
            DEPARTAMENTO: data.DEPARTAMENTO || '',
            REGIONAL: data.REGIONAL || '',
            ESTADO: data.ESTADO || 'ACTIVA',
            COMPLEMENTARIA_1: data.COMPLEMENTARIA_1 || {},
            COMPLEMENTARIA_2: data.COMPLEMENTARIA_2 || {},
            FECHA_REGISTRO: new Date().toISOString()
        });

        return res.status(201).json({
            error: 0,
            response: {
                mensaje: 'IPS creada exitosamente',
                ips: {
                    _id: nuevaIPS._id,
                    NOMBRE_IPS: nuevaIPS.NOMBRE_IPS,
                    NIT: nuevaIPS.NIT,
                    DIRECCION: nuevaIPS.DIRECCION,
                    TELEFONO: nuevaIPS.TELEFONO,
                    CORREO: nuevaIPS.CORREO,
                    REPRESENTANTE: nuevaIPS.REPRESENTANTE,
                    CIUDAD: nuevaIPS.CIUDAD,
                    DEPARTAMENTO: nuevaIPS.DEPARTAMENTO,
                    REGIONAL: nuevaIPS.REGIONAL,
                    ESTADO: nuevaIPS.ESTADO,
                    FECHA_REGISTRO: nuevaIPS.FECHA_REGISTRO
                }
            }
        });

    } catch (err) {
        console.error('Error en /api/ips/crear:', err);
        return res.status(500).json({ error: 1, response: { mensaje: 'Error interno del servidor' } });
    }
});

router.post('/actualizar', async (req, res) => {
    try {
        
        const authHeader = req.headers['authorization'] || req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 1, response: { mensaje: 'Token requerido' } });
        }
        const token = authHeader.substring(7);
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ error: 1, response: { mensaje: 'Servidor sin JWT_SECRET configurado' } });
        }
        try {
            jwt.verify(token, secret);
        } catch (e) {
            return res.status(401).json({ error: 1, response: { mensaje: 'Token inválido o expirado' } });
        }

        const { id, ...updateData } = req.body;

        if (!id) {
            return res.status(400).json({ error: 1, response: { mensaje: 'Se requiere el id de la IPS a actualizar' } });
        }

        
        const ipsActualizada = await IPS.findByIdAndUpdate(id, updateData, { new: true });

        if (!ipsActualizada) {
            return res.status(404).json({ error: 1, response: { mensaje: `No se encontró la IPS con id '${id}'` } });
        }

        return res.status(200).json({
            error: 0,
            response: {
                mensaje: 'IPS actualizada exitosamente',
                ips: ipsActualizada
            }
        });

    } catch (err) {
        console.error('Error en /api/ips/actualizar:', err);
        return res.status(500).json({ error: 1, response: { mensaje: 'Error interno del servidor' } });
    }
});
module.exports = router;