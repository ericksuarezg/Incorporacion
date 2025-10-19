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

    
    const hojasVida = await HojaVida.find({}).lean();

    
    return res.status(200).json({
      error: 0,
      response: {
        mensaje: 'Consulta exitosa',
        data: hojasVida
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

router.post('/por_ips', async (req, res) => {
    try {
        
        const { token, nombreIps } = req.body;

        if (!token) {
            return res.status(401).json({ error: 1, response: { mensaje: 'Token requerido' } });
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ error: 1, response: { mensaje: 'Servidor sin JWT_SECRET configurado' } });
        }

        try {
            jwt.verify(token, secret);
        } catch (e) {
            return res.status(401).json({ error: 1, response: { mensaje: 'Token inválido o expirado' } });
        }

        if (!nombreIps || nombreIps.trim() === '') {
            return res.status(400).json({ error: 1, response: { mensaje: 'Se debe enviar el nombre de la IPS' } });
        }

        
        const ips = await IPS.findOne({ NOMBRE_IPS: nombreIps.trim() }).lean();
        if (!ips) {
            return res.status(404).json({
                error: 1,
                response: { mensaje: `No se encontró la IPS '${nombreIps}' o no tiene registros asociados` }
            });
        }

        const hojasVida = await HojaVida.find({ IPS_ID: ips._id }).lean();

        if (hojasVida.length === 0) {
            return res.status(404).json({
                error: 1,
                response: { mensaje: `No existen hojas de vida asociadas a la IPS '${nombreIps}'` }
            });
        }

        
        const data = hojasVida.map(hv => ({
            _id: hv._id,
            DOCUMENTO: hv.DOCUMENTO,
            NOMBRE: hv.NOMBRE,
            PRIMER_APELLIDO: hv.PRIMER_APELLIDO,
            NOMBREIPS: ips.NOMBRE_IPS,
            EXAMENES: hv.COMPLEMENTARIA_1 || [],
            FECHA_EXAMEN: hv.FECHA_INSCRIPCION || '',
            HORA_EXAMEN: hv.COMPLEMENTARIA_2?.hora || ''
        }));

        return res.status(200).json({
            error: 0,
            response: {
                mensaje: 'Consulta exitosa',
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

        const { id, nombreIps, fechaAgendamiento, horaAgendamiento, examenes } = req.body;

        if (!id || !nombreIps || !fechaAgendamiento || !horaAgendamiento || !Array.isArray(examenes)) {
            return res.status(400).json({ error: 1, response: { mensaje: 'Todos los campos son requeridos y examenes debe ser un array' } });
        }

        
        const ips = await IPS.findOne({ NOMBRE_IPS: nombreIps.trim() });
        if (!ips) {
            return res.status(404).json({ error: 1, response: { mensaje: `No se encontró la IPS '${nombreIps}'` } });
        }

        
        const hojaActualizada = await HojaVida.findByIdAndUpdate(
            id,
            {
                IPS_ID: ips._id,
                FECHA_EXAMEN: fechaAgendamiento,
                HORA_EXAMEN: horaAgendamiento,
                EXAMENES: examenes
            },
            { new: true }
        );

        if (!hojaActualizada) {
            return res.status(404).json({ error: 1, response: { mensaje: `No se encontró la hoja de vida con id '${id}'` } });
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


module.exports = router;