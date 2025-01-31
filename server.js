const express = require('express');
const bodyParser = require('body-parser');
const { soap } = require('strong-soap');

const app = express();
const port = 3000;

// Middleware para processar JSON com limite aumentado
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

// Rota principal para receber o payload
app.post('/soap-request', async (req, res) => {
    try {
        const payload = req.body;
        
        // Validação do payload
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
            return res.status(400).json({ 
                error: 'Payload inválido. É necessário enviar um objeto JSON.' 
            });
        }

        console.log(payload);
        // Estrutura esperada pelo webservice
        const soapPayload = {
            'numeroProcesso': payload.numeroProcesso,
            'dadosBasicos': {
                '$attributes': {
                    'classeProcessual': payload.dadosBasicos?.classeProcessual,
                    'codigoLocalidade': payload.dadosBasicos?.codigoLocalidade,
                    'competencia': payload.dadosBasicos?.competencia,
                    'nivelSigilo': payload.dadosBasicos?.nivelSigilo
                },
                'polo': payload.dadosBasicos?.polo?.map(polo => ({
                    '$attributes': {
                        'polo': polo.polo
                    },
                    'parte': polo.parte?.map(parte => ({
                        'pessoa': {
                            '$attributes': {
                                'nome': parte.pessoa?.nome,
                                'numeroDocumentoPrincipal': parte.pessoa?.numeroDocumentoPrincipal,
                                'tipoPessoa': parte.pessoa?.tipoPessoa
                            },
                            ...(parte.pessoa?.documento && {
                                'documento': {
                                    '$attributes': {
                                        'codigoDocumento': parte.pessoa.documento.codigoDocumento,
                                        'emissorDocumento': parte.pessoa.documento.emissorDocumento,
                                        'tipoDocumento': parte.pessoa.documento.tipoDocumento,
                                        'nome': parte.pessoa.documento.nome
                                    }
                                }
                            }),
                            ...(parte.pessoa?.endereco && {
                                'endereco': {
                                    '$attributes': {
                                        'cep': parte.pessoa.endereco.cep
                                    },
                                    'logradouro': parte.pessoa.endereco.logradouro,
                                    'numero': parte.pessoa.endereco.numero,
                                    'bairro': parte.pessoa.endereco.bairro,
                                    'estado': parte.pessoa.endereco.estado,
                                    'pais': parte.pessoa.endereco.pais
                                }
                            })
                        }
                    }))
                })),
                ...(payload.dadosBasicos?.assunto && {
                    'assunto': {
                        'codigoNacional': payload.dadosBasicos.assunto.codigoNacional
                    }
                })
            },
            'senhaManifestante': payload.senhaManifestante,
            'documento': payload.documento?.map(doc => ({
                '$attributes': {
                    ...(doc.tipoDocumento && { 'tipoDocumento': doc.tipoDocumento }),
                    ...(doc.dataHora && { 'dataHora': doc.dataHora }),
                    'mimetype': doc.mimetype || 'application/pdf',
                    ...(doc.nivelSigilo && { 'nivelSigilo': doc.nivelSigilo }),
                    ...(doc.descricao && { 'descricao': doc.descricao })
                },
                'conteudo': doc.conteudo
            })),
            'idManifestante': payload.idManifestante,
            'dataEnvio': payload.dataEnvio,
            'parametros': payload.parametros || []
        };


        const url = 'https://hml.pje.stg.apps.tjap.jus.br/1g/intercomunicacao?wsdl';
        
        const options = {
            endpoint: url,
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

        soap.createClient(url, options, function(err, client) {
            if (err) {
                console.error('Erro ao criar cliente SOAP:', err);
                return res.status(500).json({ error: 'Erro ao criar cliente SOAP', details: err.message });
            }

            // Log do XML antes de enviar
            console.log('XML a ser enviado:', client.lastRequest);

            client.entregarManifestacaoProcessual(soapPayload, function(err, result, envelope, soapHeader) {
                if (err) {
                    console.error('Erro na chamada SOAP:', err);
                    return res.status(500).json({ 
                        error: 'Erro na chamada SOAP', 
                        faultcode: err.root?.Envelope?.Body?.Fault?.faultcode || err.code,
                        faultstring: err.root?.Envelope?.Body?.Fault?.faultstring || err.message,
                        details: err.root?.Envelope?.Body?.Fault?.detail || err.detail
                    });
                }
                
                // Log completo da resposta
                console.log('Envelope completo:', envelope);
                console.log('SOAP Header:', soapHeader);
                console.log('Resultado bruto:', result);

                // Retorna o resultado como JSON
                res.json({
                    success: true,
                    result: result,
                    envelope: envelope,
                    soapHeader: soapHeader
                });
            });
        });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});