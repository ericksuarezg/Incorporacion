const express = require('express');
const jwt = require('jsonwebtoken');
const HojaVida = require('../server/models/hojaVida/hojaVida');

const router = express.Router();

router.post('/crear', async (req, res) => {
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

        const hojasVida = Array.isArray(data) ? data : [data];

        if (hojasVida.length === 0) {
            return res.status(400).json({ error: 1, response: { mensaje: 'No se enviaron datos de hojas de vida' } });
        }

        const documentosEnviados = hojasVida
            .map(hoja => hoja.DOCUMENTO)
            .filter(doc => doc !== null && doc !== undefined && String(doc).trim() !== '')
            .map(doc => String(doc).trim());

        if (documentosEnviados.length === 0) {
            return res.status(400).json({ error: 1, response: { mensaje: 'No se encontraron documentos válidos en los datos enviados' } });
        }

        const documentosExistentes = await HojaVida.find({
            DOCUMENTO: { $in: documentosEnviados }
        }).select('DOCUMENTO NOMBRE PRIMER_APELLIDO').lean();

        if (documentosExistentes.length > 0) {
            const documentosDuplicados = documentosExistentes.map(doc => ({
                documento: doc.DOCUMENTO,
                nombre: `${doc.NOMBRE || ''} ${doc.PRIMER_APELLIDO || ''}`.trim()
            }));

            return res.status(409).json({
                error: 1,
                response: {
                    mensaje: 'Se encontraron documentos ya registrados',
                    documentos_duplicados: documentosDuplicados,
                    total_duplicados: documentosDuplicados.length
                }
            });
        }

        const documentosUnicos = new Set();
        const duplicadosInternos = [];
        
        for (const hoja of hojasVida) {
            if (hoja.DOCUMENTO !== null && hoja.DOCUMENTO !== undefined && String(hoja.DOCUMENTO).trim() !== '') {
                const doc = String(hoja.DOCUMENTO).trim();
                if (documentosUnicos.has(doc)) {
                    duplicadosInternos.push({
                        documento: doc,
                        nombre: `${hoja.NOMBRE || ''} ${hoja.PRIMER_APELLIDO || ''}`.trim()
                    });
                } else {
                    documentosUnicos.add(doc);
                }
            }
        }

        if (duplicadosInternos.length > 0) {
            return res.status(400).json({
                error: 1,
                response: {
                    mensaje: 'Se encontraron documentos duplicados en el mismo envío',
                    documentos_duplicados_internos: duplicadosInternos,
                    total_duplicados: duplicadosInternos.length
                }
            });
        }

        const resultados = [];
        for (const hojaData of hojasVida) {
            const hojaVidaDoc = await HojaVida.create(hojaData);
            resultados.push({
                id: hojaVidaDoc._id,
                DOCUMENTO: hojaData.DOCUMENTO,
                NOMBRE: hojaData.NOMBRE
            });
        }

        return res.status(201).json({
            error: 0,
            response: {
                mensaje: `${resultados.length} hoja(s) de vida guardada(s) exitosamente`,
                hojas_vida: resultados
            }
        });
    } catch (err) {
        console.error('Error en /api/hojas-vida/crear:', err);
        return res.status(500).json({ error: 1, response: { mensaje: 'Error interno del servidor' } });
    }
});

router.get('/consultar', async (req, res) => {
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

        const hojasVida = await HojaVida.find({}).lean();

        return res.status(200).json({
            error: 0,
            response: {
                mensaje: `Se encontraron ${hojasVida.length} hoja(s) de vida`,
                total_registros: hojasVida.length,
                hojas_vida: hojasVida
            }
        });
    } catch (err) {
        console.error('Error en /api/hojas-vida/consultar:', err);
        return res.status(500).json({ error: 1, response: { mensaje: 'Error interno del servidor' } });
    }
});

module.exports = router;