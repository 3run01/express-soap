const { soap } = require('strong-soap');
const soapMethodService = require('./soapMethodService');

class SoapService {
    constructor() {
        this.url = process.env.SOAP_URL;
        this.options = {
            endpoint: this.url,
            envelopeKey: 'soap',
            xmlKey: 'xml',
            wsdl_options: {
                attributesKey: '$attributes',
                valueKey: '$value',
                xmlKey: '$xml'
            },
            wsdl_headers: {
                'SOAPAction': '',
                'Content-Type': 'text/xml;charset=UTF-8'
            },
            forceSoap12Headers: false,
            namespaceArrayElements: false
        };
    }

    async createSoapClient() {
        return new Promise((resolve, reject) => {
            soap.createClient(this.url, this.options, (err, client) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(client);
            });
        });
    }

    async executeMethod(methodName, payload) {
        try {
            const client = await this.createSoapClient();
            console.log('XML a ser enviado:', client.lastRequest);

            return await soapMethodService.executeSoapMethod(client, methodName, payload);
        } catch (error) {
            throw error;
        }
    }

    async entregarManifestacao(soapPayload) {
        return this.executeMethod('entregarManifestacaoProcessual', soapPayload);
    }
}

module.exports = new SoapService(); 