const express = require('express');
const jwt = require('jsonwebtoken');
const HojaVida = require('../server/models/hojaVida/hojaVida');
const IPS = require('../server/models/ips/ips');


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

        // Filtrar solo registros que NO tengan IPS_ID (null, undefined o no existe el campo)
        const hojasVida = await HojaVida.find({
            $or: [
                { IPS_ID: { $exists: false } },
                { IPS_ID: null },
                { IPS_ID: undefined }
            ]
        }).lean();

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

router.get('/', async (req, res) => {
    try {

        const authHeader = req.headers['authorization'] || req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 1,
                response: { mensaje: 'Token requerido' }
            });
        }

        const token = authHeader.substring(7);
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            return res.status(500).json({
                error: 1,
                response: { mensaje: 'Servidor sin JWT_SECRET configurado' }
            });
        }

        try {
            jwt.verify(token, secret);
        } catch (e) {
            return res.status(401).json({
                error: 1,
                response: { mensaje: 'Token inválido o expirado' }
            });
        }


        // Filtrar hojas de vida que NO tienen IPS_ID asignada
        const hojasVida = await HojaVida.find({
            $or: [
                { IPS_ID: { $exists: false } },
                { IPS_ID: null },
                { IPS_ID: undefined }
            ]
        }).lean();


        return res.status(200).json({
            error: 0,
            response: {
                mensaje: 'Consulta exitosa - Hojas de vida sin IPS asignada',
                data: hojasVida,
                total: hojasVida.length
            }
        });

    } catch (err) {
        console.error('Error en /api/hoja_vida:', err);
        return res.status(500).json({
            error: 1,
            response: { mensaje: 'Error inesperado' }
        });
    }
});

// Nuevo servicio para traer TODAS las hojas de vida sin restricciones
router.get('/hojas-vida-full', async (req, res) => {
    try {
        // Validación de token
        const authHeader = req.headers['authorization'] || req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 1,
                response: { mensaje: 'Token requerido' }
            });
        }

        const token = authHeader.substring(7);
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            return res.status(500).json({
                error: 1,
                response: { mensaje: 'Servidor sin JWT_SECRET configurado' }
            });
        }

        try {
            jwt.verify(token, secret);
        } catch (e) {
            return res.status(401).json({
                error: 1,
                response: { mensaje: 'Token inválido o expirado' }
            });
        }

        // Traer TODAS las hojas de vida sin ningún filtro
        const hojasVida = await HojaVida.find({}).lean();

        return res.status(200).json({
            error: 0,
            response: {
                mensaje: 'Consulta exitosa - Todas las hojas de vida',
                data: hojasVida,
                total: hojasVida.length
            }
        });

    } catch (err) {
        console.error('Error en /api/hojas-vida/hojas-vida-full:', err);
        return res.status(500).json({
            error: 1,
            response: { mensaje: 'Error inesperado' }
        });
    }
});

// Nuevo servicio para traer TODAS las hojas de vida sin restricciones
router.get('/hojas-vida-full', async (req, res) => {
    try {
        // Validación de token
        const authHeader = req.headers['authorization'] || req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 1,
                response: { mensaje: 'Token requerido' }
            });
        }

        const token = authHeader.substring(7);
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            return res.status(500).json({
                error: 1,
                response: { mensaje: 'Servidor sin JWT_SECRET configurado' }
            });
        }

        try {
            jwt.verify(token, secret);
        } catch (e) {
            return res.status(401).json({
                error: 1,
                response: { mensaje: 'Token inválido o expirado' }
            });
        }

        // Traer TODAS las hojas de vida sin ningún filtro
        const hojasVida = await HojaVida.find({}).lean();

        return res.status(200).json({
            error: 0,
            response: {
                mensaje: 'Consulta exitosa - Todas las hojas de vida',
                data: hojasVida,
                total: hojasVida.length
            }
        });

    } catch (err) {
        console.error('Error en /api/hojas-vida/hojas-vida-full:', err);
        return res.status(500).json({
            error: 1,
            response: { mensaje: 'Error inesperado' }
        });
    }
});

router.post('/por_ips', async (req, res) => {
    try {

        const { ips_id } = req.body;

        // Obtener token del header Authorization
        const authHeader = req.headers['authorization'] || req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 1, response: { mensaje: 'Token Bearer requerido' } });
        }

        const token = authHeader.substring(7); // Remover 'Bearer '

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ error: 1, response: { mensaje: 'Servidor sin JWT_SECRET configurado' } });
        }

        try {
            jwt.verify(token, secret);
        } catch (e) {
            return res.status(401).json({ error: 1, response: { mensaje: 'Token inválido o expirado' } });
        }

        if (!ips_id || ips_id.trim() === '') {
            return res.status(400).json({ error: 1, response: { mensaje: 'Se debe enviar el ID de la IPS' } });
        }

        // Buscar IPS por ID
        const ips = await IPS.findById(ips_id).lean();
        if (!ips) {
            return res.status(404).json({
                error: 1,
                response: { mensaje: `No se encontró la IPS con ID '${ips_id}' o no tiene registros asociados` }
            });
        }

        const hojasVida = await HojaVida.find({ IPS_ID: ips._id }).lean();

        if (hojasVida.length === 0) {
            return res.status(404).json({
                error: 1,
                response: { mensaje: `No existen hojas de vida asociadas a la IPS '${ips.NOMBRE_IPS}'` }
            });
        }


        const data = hojasVida.map(hv => ({
            ...hv, // Incluir todos los campos del documento original
            NOMBREIPS: ips.NOMBRE_IPS // Agregar el nombre de la IPS
        }));

        return res.status(200).json({
            error: 0,
            response: {
                mensaje: `Hojas de vida de la IPS: ${ips.NOMBRE_IPS}`,
                total: hojasVida.length,
                data
            }
        });

    } catch (err) {
        console.error('Error en /api/hoja_vida/por_ips:', err);
        return res.status(500).json({ error: 1, response: { mensaje: 'Error interno del servidor' } });
    }
});
router.post('/por_documento', async (req, res) => {
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

        const { documento } = req.body;

        if (!documento || String(documento).trim() === '') {
            return res.status(400).json({ error: 1, response: { mensaje: 'Se requiere el número de documento' } });
        }


        const hojaVida = await HojaVida.findOne({ DOCUMENTO: documento.trim() }).populate('IPS_ID').lean();

        if (!hojaVida) {
            return res.status(404).json({ error: 1, response: { mensaje: `Documento '${documento}' no encontrado` } });
        }


        const respuesta = {
            _id: hojaVida._id,
            DOCUMENTO: hojaVida.DOCUMENTO,
            NOMBRE: hojaVida.NOMBRE,
            PRIMER_APELLIDO: hojaVida.PRIMER_APELLIDO,
            NOMBREIPS: hojaVida.IPS_ID ? hojaVida.IPS_ID.NOMBRE_IPS : null,
            EXAMENES: hojaVida.EXAMENES || [],
            FECHA_EXAMEN: hojaVida.FECHA_EXAMEN || null,
            HORA_EXAMEN: hojaVida.HORA_EXAMEN || null
        };

        return res.status(200).json({
            error: 0,
            response: {
                mensaje: 'Consulta exitosa',
                data: respuesta
            }
        });

    } catch (err) {
        console.error('Error en /api/hoja_vida/por_documento:', err);
        return res.status(500).json({ error: 1, response: { mensaje: 'Error interno del servidor' } });
    }
});

router.put('/agendar', async (req, res) => {
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

        const { hojaVidaId, fecha_hora, examenes, recomendaciones, usuario_id, ips_id } = req.body;

        if (!hojaVidaId || !fecha_hora || !examenes || !recomendaciones || !usuario_id || !ips_id) {
            return res.status(400).json({ error: 1, response: { mensaje: 'Todos los campos son requeridos: hojaVidaId, fecha_hora, examenes, recomendaciones, usuario_id, ips_id' } });
        }

        // Verificar que la IPS existe
        const ips = await IPS.findById(ips_id);
        if (!ips) {
            return res.status(404).json({ error: 1, response: { mensaje: `No se encontró la IPS con id '${ips_id}'` } });
        }

        // Convertir fecha_hora a Date object
        const fechaHoraDate = new Date(fecha_hora);
        if (isNaN(fechaHoraDate.getTime())) {
            return res.status(400).json({ error: 1, response: { mensaje: 'Formato de fecha_hora inválido. Use formato ISO: YYYY-MM-DDTHH:mm' } });
        }

        const hojaActualizada = await HojaVida.findByIdAndUpdate(
            hojaVidaId,
            {
                IPS_ID: ips_id,
                FECHA_HORA: fechaHoraDate,
                EXAMENES: examenes,
                RECOMENDACIONES: recomendaciones,
                USUARIO_ID: usuario_id,
                ESTADO: 'EN ESPERA'
            },
            { new: true }
        );

        if (!hojaActualizada) {
            return res.status(404).json({ error: 1, response: { mensaje: `No se encontró la hoja de vida con id '${hojaVidaId}'` } });
        }

        return res.status(200).json({
            error: 0,
            response: {
                mensaje: 'Agendamiento actualizado correctamente',
                id: hojaActualizada._id
            }
        });

    } catch (err) {
        console.error('Error en /api/hoja_vida/agendar:', err);
        return res.status(500).json({ error: 1, response: { mensaje: 'Error inesperado al actualizar el documento' } });
    }
});

// Nuevo endpoint: Consultar hojas de vida que SÍ tienen IPS asignada y estado EN ESPERA (sin autenticación)
router.get('/con-ips', async (req, res) => {
    try {
        // Consultar hojas de vida que SÍ tienen IPS_ID asignada y estado EN ESPERA
        const hojasVidaConIps = await HojaVida.find({
            IPS_ID: { $exists: true, $ne: null },
            ESTADO: 'EN ESPERA'
        }).populate('IPS_ID').lean();

        return res.status(200).json({
            error: 0,
            response: {
                mensaje: `Se encontraron ${hojasVidaConIps.length} hoja(s) de vida con IPS asignada y estado EN ESPERA`,
                total_registros: hojasVidaConIps.length,
                hojas_vida: hojasVidaConIps
            }
        });

    } catch (err) {
        console.error('Error en /api/hojas-vida/con-ips:', err);
        return res.status(500).json({ error: 1, response: { mensaje: 'Error interno del servidor' } });
    }
});

// Endpoint para actualizar estado de hoja de vida (sin autenticación)
router.put('/:hojaVidaId/estado', async (req, res) => {
    try {
        const { hojaVidaId } = req.params;
        const { estado, detalle } = req.body;

        // Validar que se envíen los campos requeridos
        if (!estado) {
            return res.status(400).json({
                error: 1,
                response: { mensaje: 'El campo estado es requerido' }
            });
        }

        // Validar que el ID sea válido
        if (!hojaVidaId || hojaVidaId.length !== 24) {
            return res.status(400).json({
                error: 1,
                response: { mensaje: 'ID de hoja de vida inválido' }
            });
        }

        // Buscar la hoja de vida
        const hojaVida = await HojaVida.findById(hojaVidaId);
        if (!hojaVida) {
            return res.status(404).json({
                error: 1,
                response: { mensaje: 'Hoja de vida no encontrada' }
            });
        }

        // Actualizar el estado y detalle
        const updateData = { ESTADO: estado };
        if (detalle !== undefined) {
            updateData.DETALLE = detalle;
        }

        const hojaActualizada = await HojaVida.findByIdAndUpdate(
            hojaVidaId,
            updateData,
            { new: true }
        );

        return res.status(200).json({
            error: 0,
            response: {
                mensaje: 'Estado actualizado correctamente',
                data: {
                    id: hojaActualizada._id,
                    estado: hojaActualizada.ESTADO,
                    detalle: hojaActualizada.DETALLE || null
                }
            }
        });

    } catch (err) {
        console.error('Error en PUT /:hojaVidaId/estado:', err);
        return res.status(500).json({
            error: 1,
            response: { mensaje: 'Error interno del servidor' }
        });
    }
});

// Servicio para bot: Consultar registros con campo DETALLE procesado (sin autenticación)
router.get('/bot/procesados', async (req, res) => {
    try {
        // Consultar hojas de vida que tengan el campo DETALLE con información de procesamiento
        const registrosProcesados = await HojaVida.find({
            DETALLE: {
                $exists: true,
                $ne: null,
                $regex: /PROCESADO_.*WhatsApp.*Email.*/i
            }
        }).lean();

        return res.status(200).json({
            error: 0,
            response: {
                mensaje: `Se encontraron ${registrosProcesados.length} registro(s) procesado(s)`,
                data: registrosProcesados.length
            }
        });

    } catch (err) {
        console.error('Error en /api/hojas-vida/bot/procesados:', err);
        return res.status(500).json({
            error: 1,
            response: { mensaje: 'Error interno del servidor' }
        });
    }
});

module.exports = router;