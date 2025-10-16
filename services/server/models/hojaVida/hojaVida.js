const { mongoose } = require('../../conection/mongo');

const hojaVidaSchema = new mongoose.Schema(
    {
        PKEYHOJAVIDA: { type: String },
        PKEYASPIRANT: { type: String },
        CODIPROGACAD: { type: String },
        ANNOPERIACAD: { type: Number },
        NUMEPERIACAD: { type: String },
        CODIGO_INSCRIPCION: { type: String },
        DOCUMENTO: { type: String },
        NOMBRE: { type: String },
        PRIMER_APELLIDO: { type: String },
        SEGUNDO_APELLIDO: { type: String },
        EDAD: { type: Number },
        GENERO: { type: String },
        FECH_NACIMIENTO: { type: String },
        CORREO: { type: String },
        TELEFONO: { type: String },
        CELULAR: { type: String },
        DIRECCION: { type: String },
        CIUDAD: { type: String },
        ESTADO: { type: String },
        DEPARTAMENTO: { type: String },
        REGIONAL: { type: String },
        COMPLEMENTARIA_1: { type: mongoose.Schema.Types.Mixed },
        COMPLEMENTARIA_2: { type: mongoose.Schema.Types.Mixed },
        FECHA_INSCRIPCION: { type: String },
        GRUP_MINO: { type: String },
        ESTRATO: { type: String },
        TIPO_MEDIO: { type: String },
        COLEGIO: { type: String }
    },
    { timestamps: true, collection: 'cl_hoja_vida' }
);

module.exports = mongoose.model('HojaVida', hojaVidaSchema);