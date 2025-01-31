require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const peticaoInicialService = require('./services/peticaoInicial');
const soapService = require('./services/soapService');

const app = express();
const port = process.env.PORT || 3000;

// Middleware para processar JSON com limite aumentado
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

// Rota principal para receber o payload
app.post('/peticao-inicial', async (req, res) => {
    try {
        const payload = req.body;
        
        // Use the service to build the SOAP payload
        const soapPayload = peticaoInicialService.buildSoapPayload(payload);

        try {
            const response = await soapService.entregarManifestacao(soapPayload);
            res.json(response);
        } catch (error) {
            console.error('Erro na chamada SOAP:', error);
            res.status(error.status || 500).json(error);
        }
    } catch (error) {
        console.error('Erro:', error);
        res.status(error.status || 500).json({ 
            error: error.error || 'Erro interno do servidor', 
            details: error.message 
        });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});