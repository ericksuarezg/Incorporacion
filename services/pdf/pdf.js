const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const HojaVida = require('../server/models/hojaVida/hojaVida');

const router = express.Router();
const UPLOAD_DIR = path.join(__dirname, '../uploads/pdf');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });


const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, `hoja_vida_${req.body.id}_${Date.now()}.pdf`)
});
const upload = multer({ storage });


router.put('/pdf', upload.single('pdf'), async (req, res) => {
    try {
        const { id, token } = req.body;

        
        if (!id || !token || !req.file) {
            return res.status(400).json({ error: 1, response: { mensaje: 'Faltan parámetros requeridos' } });
        }

        
        const secret = process.env.JWT_SECRET;
        if (!secret) return res.status(500).json({ error: 1, response: { mensaje: 'Servidor sin JWT_SECRET configurado' } });

        try {
            jwt.verify(token, secret);
        } catch (e) {
            return res.status(401).json({ error: 1, response: { mensaje: 'Token inválido o expirado' } });
        }

        
        const pdfUrl = `/uploads/pdf/${req.file.filename}`;
        const update = await HojaVida.findByIdAndUpdate(
            id,
            { PDF_URL: pdfUrl },
            { new: true }
        );

        if (!update) {
            return res.status(404).json({ error: 1, response: { mensaje: 'No se encontró el documento' } });
        }

        return res.status(200).json({
            error: 0,
            response: {
                mensaje: 'PDF almacenado correctamente',
                id: update._id,
                url: pdfUrl
            }
        });

    } catch (err) {
        console.error('Error en /api/hoja_vida/pdf:', err);
        return res.status(500).json({ error: 1, response: { mensaje: 'Error inesperado al guardar el PDF' } });
    }
});

module.exports = router;
