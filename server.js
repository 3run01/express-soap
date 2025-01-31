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
            'entregarManifestacaoProcessual': {
                '$attributes': {
                    'xmlns': 'http://www.cnj.jus.br/tipos-servico-intercomunicacao-2.2.2',
                    'xmlns:ns4': 'http://www.cnj.jus.br/intercomunicacao-2.2.2',
                    'xmlns:ns2': 'http://www.cnj.jus.br/mni/cda'
                },
                'idManifestante': payload.idManifestante,
                'senhaManifestante': payload.senhaManifestante,
                'numeroProcesso': payload.numeroProcesso,
                'dadosBasicos': {
                    '$attributes': {
                        'classeProcessual': payload.dadosBasicos?.classeProcessual,
                        'codigoLocalidade': payload.dadosBasicos?.codigoLocalidade,
                        'competencia': payload.dadosBasicos?.competencia,
                        'nivelSigilo': payload.dadosBasicos?.nivelSigilo
                    },
                    'classeProcessual': payload.dadosBasicos?.classeProcessual,
                    'codigoLocalidade': payload.dadosBasicos?.codigoLocalidade,
                    'competencia': payload.dadosBasicos?.competencia,
                    'polo': payload.dadosBasicos?.polo?.map(polo => ({
                        'polo': polo.polo,
                        'parte': polo.parte?.map(parte => ({
                            'pessoa': {
                                'nome': parte.pessoa?.nome || '',
                                'numeroDocumentoPrincipal': parte.pessoa?.numeroDocumentoPrincipal || '',
                                'tipoPessoa': parte.pessoa?.tipoPessoa || '',
                                'documento': {
                                    'codigoDocumento': parte.pessoa?.documento?.codigoDocumento || '',
                                    'emissorDocumento': parte.pessoa?.documento?.emissorDocumento || '',
                                    'tipoDocumento': parte.pessoa?.documento?.tipoDocumento || '',
                                    'nome': parte.pessoa?.documento?.nome || ''
                                },
                                'endereco': {
                                    'cep': parte.pessoa?.endereco?.cep || '',
                                    'logradouro': parte.pessoa?.endereco?.logradouro || '',
                                    'numero': parte.pessoa?.endereco?.numero || '',
                                    'bairro': parte.pessoa?.endereco?.bairro || '',
                                    'municipio': parte.pessoa?.endereco?.municipio || '',
                                    'estado': parte.pessoa?.endereco?.estado || '',
                                    'pais': parte.pessoa?.endereco?.pais || ''
                                }
                            }
                        }))
                    })),
                    'assunto': {
                        'codigoNacional': payload.dadosBasicos?.assunto?.codigoNacional
                    },
                    'prioridade': payload.dadosBasicos?.prioridade,
                    'valorCausa': payload.dadosBasicos?.valorCausa,
                    'orgaoJulgador': payload.dadosBasicos?.orgaoJulgador || {}
                },
                'documento': {
                    'tipoDocumento': payload.documento?.tipoDocumento,
                    'mimetype': payload.documento?.mimetype || 'application/pdf',
                    'conteudo': payload.documento?.conteudo
                },
                'dataEnvio': new Date().toISOString(),
                'parametros': payload.parametros || []
            }
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
                    return res.status(500).json({ error: 'Erro na chamada SOAP', details: err.message });
                }
                
                // Log completo da resposta
                console.log('Envelope completo:', envelope);
                console.log('SOAP Header:', soapHeader);
                console.log('Resultado bruto:', result);

                // Se não houver resultado, retorna erro
                if (!result) {
                    return res.status(500).json({ 
                        error: 'Resposta vazia do serviço',
                        envelope: envelope
                    });
                }

                // Retorna o resultado com informações adicionais
                res.json({
                    success: true,
                    data: result,
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