const { mongoose } = require('../../conection/mongo');

const userSchema = new mongoose.Schema(
    {
        Cr_Nombre_Usuario: { type: String, required: true, unique: true, trim: true, lowercase: false },
        Cr_Password: { type: String, required: true }
    },
    { timestamps: true, collection: 'cl_credencial' }
);

userSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.Cr_Password;
        return ret;
    }
});

module.exports = mongoose.model('User', userSchema);