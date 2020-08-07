"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const entorno_1 = __importDefault(require("../variablesEntorno/entorno"));
const qrcode_1 = __importDefault(require("qrcode"));
const child_process_1 = __importDefault(require("child_process"));
const app = express_1.default();
// Para que el request pueda recuperar los valores de los parámteros enviados desde el cliente se agregan estas líneas.
// The following example shows how to use body-parsing middleware to populate req.body.
app.use(express_1.default.json()); // for parsing application/json
app.use(express_1.default.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.listen(entorno_1.default.puerto, () => console.log(`El servidor está corriendo en el puerto ${entorno_1.default.puerto}`));
app.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = { id: 1 };
    const token = jsonwebtoken_1.default.sign(user, entorno_1.default.token.secretKey, {
        expiresIn: entorno_1.default.token.expires
    });
    //res.send(token);
    res.json({
        token: token
    });
}));
app.get('/generarQr', validarToken, (req = Request, res) => {
    const { folio, numeroPlaca, marca, linea, anioModelo, serieVehiculo, tipoServicio } = req.body;
    let datosQr = '*' + numeroPlaca + '*' + folio + '*' +
        entorno_1.default.datosQr.entidadFederativa + '*' +
        entorno_1.default.datosQr.razonSocialFabricante + '*' +
        entorno_1.default.datosQr.numeroRegistroCalcomaniaPlacas + '*' +
        entorno_1.default.datosQr.loteFabricacion + '*' +
        entorno_1.default.datosQr.tipoDocumento + '*' +
        tipoServicio + '*' + marca + '*' + linea + '*' +
        anioModelo + '*' + serieVehiculo + '*' +
        entorno_1.default.datosQr.vigencia + '*' +
        entorno_1.default.datosQr.anioFabricacion + '*';
    jsonwebtoken_1.default.verify(req.token, entorno_1.default.token.secretKey, (err, data) => __awaiter(void 0, void 0, void 0, function* () {
        if (err) {
            res.sendStatus(403);
        }
        else {
            qrcode_1.default.toFile("imagenesQr/Qr.png", datosQr, {
                color: {
                    dark: '#000',
                    light: '#0000' // Transparent background
                },
                width: 250
            }, (err) => {
                if (err) {
                    res.status(400).json('No se pudo generar el QR.');
                    throw err;
                }
                else {
                    res.status(200).json({
                        text: 'QR generado correcamente.',
                        data: data
                    });
                }
            });
        }
    }));
});
app.get('/generarEsteganografia', validarToken, (req = Request, res) => {
    jsonwebtoken_1.default.verify(req.token, entorno_1.default.token.secretKey, (err, data) => __awaiter(void 0, void 0, void 0, function* () {
        if (err) {
            res.sendStatus(403);
        }
        else {
            const { rutaImagen } = req.body;
            child_process_1.default.execSync(`stegjs imagenesQr/Qr.png --encode 'https://tinyurl.com/yyv7z8fw' 5x5 imagenesQr/QrSecreta.png`);
            res.status(200).json('Proceso de Esteganografía correcto.');
        }
    }));
});
app.get('/redimensionarQr', validarToken, (req = Request, res) => {
    jsonwebtoken_1.default.verify(req.token, entorno_1.default.token.secretKey, (err, data) => __awaiter(void 0, void 0, void 0, function* () {
        if (err) {
            res.sendStatus(403);
        }
        else {
            child_process_1.default.exec("sips -s dpiHeight 300.0 -s dpiWidth 300.0 -Z 177 imagenesQr/Qr.png", (error, stdout, stderr) => {
                if (error) {
                    console.log(`error: ${error.message}`);
                    res.status(400).json('No se pudo generar el redimensionamiento');
                    return;
                }
                if (stderr) {
                    console.log(`stderr: ${stderr}`);
                    res.status(400).json('No se pudo generar el redimensionamiento');
                    return;
                }
                console.log(`stdout: ${stdout}`);
                res.status(200).json('Redimensionamiento correcto.');
            });
        }
    }));
});
// Middleware para validar el token enviado.
function validarToken(req = Request, res, next) {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    }
    else {
        res.sendStatus(403);
    }
}
