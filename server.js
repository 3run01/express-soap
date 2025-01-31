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
        // Estrutura esperada pelo webservice
        const soapPayload = {
            'ns3:entregarManifestacaoProcessual': {
                '$attributes': {
                    'xmlns:ns3': 'http://www.cnj.jus.br/tipos-servico-intercomunicacao-2.2.2',
                    'xmlns:ns4': 'http://www.cnj.jus.br/intercomunicacao-2.2.2',
                    'xmlns:ns2': 'http://www.cnj.jus.br/mni/cda'
                },
                'idManifestante': '01396356290',
                'senhaManifestante': '#mp@2023',
                'numeroProcesso': payload.numeroProcesso,
                'ns3:dadosBasicos': {
                    '$attributes': {
                        'classeProcessual': payload.dadosBasicos.classeProcessual,
                        'codigoLocalidade': payload.dadosBasicos.codigoLocalidade,
                        'competencia': payload.dadosBasicos.competencia,
                        'nivelSigilo': payload.dadosBasicos.nivelSigilo
                    },
                    'classeProcessual': payload.dadosBasicos.classeProcessual,
                    'codigoLocalidade': payload.dadosBasicos.codigoLocalidade,
                    'competencia': payload.dadosBasicos.competencia,
                    'nivelSigilo': payload.dadosBasicos.nivelSigilo,
                    'ns4:polo': payload.dadosBasicos.polo.map(p => ({
                        'polo': p.polo,
                        'ns4:parte': {
                            'ns4:pessoa': {
                                'nome': p.parte.pessoa.nome,
                                'numeroDocumentoPrincipal': p.parte.pessoa.numeroDocumentoPrincipal,
                                'tipoPessoa': p.parte.pessoa.tipoPessoa,
                                'ns4:documento': {
                                    'codigoDocumento': p.parte.pessoa.documento.codigoDocumento,
                                    'emissorDocumento': p.parte.pessoa.documento.emissorDocumento,
                                    'tipoDocumento': p.parte.pessoa.documento.tipoDocumento,
                                    'nome': p.parte.pessoa.documento.nome
                                },
                                'ns4:endereco': {
                                    'cep': p.parte.pessoa.endereco.cep,
                                    'ns4:logradouro': p.parte.pessoa.endereco.logradouro,
                                    'ns4:numero': p.parte.pessoa.endereco.numero,
                                    'ns4:complemento': p.parte.pessoa.endereco.complemento || '',
                                    'ns4:bairro': p.parte.pessoa.endereco.bairro,
                                    'ns4:cidade': p.parte.pessoa.endereco.cidade,
                                    'ns4:estado': p.parte.pessoa.endereco.estado,
                                    'ns4:pais': p.parte.pessoa.endereco.pais
                                }
                            }
                        }
                    })),
                    'ns4:assunto': {
                        'ns4:codigoNacional': payload.dadosBasicos.assunto.codigoNacional
                    },
                    'ns4:prioridade': payload.dadosBasicos.prioridade,
                    'ns4:valorCausa': payload.dadosBasicos.valorCausa,
                    'ns4:orgaoJulgador': payload.dadosBasicos.orgaoJulgador || {}
                },
                'ns3:documento': {
                    'tipoDocumento': payload.documento.tipoDocumento,
                    'mimetype': payload.documento.mimetype || 'application/pdf',
                    'ns4:conteudo': payload.documento.conteudo
                },
                'ns3:dataEnvio': new Date().toISOString(),
                'ns3:parametros': payload.parametros || []
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
                'SOAPAction': 'http://www.cnj.jus.br/servico-intercomunicacao-2.2.2/entregarManifestacaoProcessual',
                'Content-Type': 'text/xml;charset=UTF-8'
            },
            forceSoap12Headers: false
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