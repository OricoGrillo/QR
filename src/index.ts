import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import entorno from '../variablesEntorno/entorno';
import qrcode from 'qrcode';
import execSync from 'child_process';

const app = express();


// Para que el request pueda recuperar los valores de los parámteros enviados desde el cliente se agregan estas líneas.
// The following example shows how to use body-parsing middleware to populate req.body.
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded


app.listen(entorno.puerto, () =>
    console.log(`El servidor está corriendo en el puerto ${entorno.puerto}`)
);

app.post('/login', async (req: Request, res: Response) => {
    const user = { id: 1 };
    const token = jwt.sign(user, entorno.token.secretKey, {
        expiresIn: entorno.token.expires
    });
    //res.send(token);
    res.json({
        token: token
    });
});

app.get('/generarQr', validarToken, (req: any = Request, res: Response) => {
    const {folio, numeroPlaca, marca, linea, anioModelo, serieVehiculo, tipoServicio} = req.body;
    let datosQr = '*' + numeroPlaca + '*' + folio + '*' + 
        entorno.datosQr.entidadFederativa + '*' + 
        entorno .datosQr.razonSocialFabricante + '*' +
        entorno.datosQr.numeroRegistroCalcomaniaPlacas + '*' +
        entorno.datosQr.loteFabricacion + '*' +
        entorno.datosQr.tipoDocumento + '*' +
        tipoServicio + '*' + marca + '*' + linea + '*' + 
        anioModelo + '*' + serieVehiculo + '*' +
        entorno.datosQr.vigencia + '*' +
        entorno.datosQr.anioFabricacion + '*';

    jwt.verify(req.token, entorno.token.secretKey, async (err: any, data:any) => {
        if(err) {
            res.sendStatus(403);
        }
        else
        {
            qrcode.toFile("imagenesQr/Qr.png", datosQr,
            {
                color: {
                  dark: '#000',  // Blue dots
                  light: '#0000' // Transparent background
                },
                width:250
            },
            (err) => 
            {
                if (err)
                {
                    res.status(400).json('No se pudo generar el QR.');
                    throw err;
                }
                else
                {
                    res.status(200).json({
                        text: 'QR generado correcamente.',
                        data: data
                    });
                }
            });
        }
    });
});

app.get('/generarEsteganografia', validarToken, (req: any = Request, res: Response) => {
    jwt.verify(req.token, entorno.token.secretKey, async (err: any, data:any) => {
        if(err) {
            res.sendStatus(403);
        } else{
            const {rutaImagen} = req.body;            
            execSync.execSync(`stegjs imagenesQr/Qr.png --encode 'https://tinyurl.com/yyv7z8fw' 5x5 imagenesQr/QrSecreta.png`);
            res.status(200).json('Proceso de Esteganografía correcto.');
        }
    });
});

app.get('/redimensionarQr', validarToken, (req: any = Request, res: Response) => {
    jwt.verify(req.token, entorno.token.secretKey, async (err: any, data:any) => {
        if(err) {
            res.sendStatus(403);
        }
        else
        {
            execSync.exec("sips -s dpiHeight 300.0 -s dpiWidth 300.0 -Z 177 imagenesQr/Qr.png", (error, stdout, stderr) => {
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
    });
});

// Middleware para validar el token enviado.
function validarToken(req: any = Request, res: Response, next: NextFunction) {
    const bearerHeader = req.headers['authorization'];

    if(typeof bearerHeader !== 'undefined'){
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } else {
        res.sendStatus(403);
    }
}