const validationService = require('./validationService');

class PeticaoInicialService {
    buildSoapPayload(payload) {
        // Valida o payload antes de transformá-lo
        validationService.validatePayload(payload);

        return {
            'numeroProcesso': payload.numeroProcesso,
            'dadosBasicos': this.buildDadosBasicos(payload.dadosBasicos),
            'senhaManifestante': payload.senhaManifestante,
            'documento': this.buildDocumentos(payload.documento),
            'idManifestante': payload.idManifestante,
            'dataEnvio': payload.dataEnvio,
            'parametros': payload.parametros || []
        };
    }

    buildDadosBasicos(dadosBasicos) {
        if (!dadosBasicos) return {};

        return {
            '$attributes': {
                'classeProcessual': dadosBasicos.classeProcessual,
                'codigoLocalidade': dadosBasicos.codigoLocalidade,
                'competencia': dadosBasicos.competencia,
                'nivelSigilo': dadosBasicos.nivelSigilo
            },
            'polo': this.buildPolos(dadosBasicos.polo),
            ...(dadosBasicos.assunto && {
                'assunto': {
                    'codigoNacional': dadosBasicos.assunto.codigoNacional
                }
            })
        };
    }

    buildPolos(polos) {
        return polos.map(polo => {
            return {
                polo: polo.polo,
                parte: this.buildPartes(polo.parte)
            };
        });
    }

    buildPartes(partes) {
        // Se partes for um objeto único, coloque-o em um array
        const partesArray = Array.isArray(partes) ? partes : [partes];
        
        return partesArray.map(parte => {
            const pessoa = parte.pessoa;
            return {
                pessoa: {
                    nome: pessoa.nome,
                    numeroDocumentoPrincipal: pessoa.numeroDocumentoPrincipal,
                    tipoPessoa: pessoa.tipoPessoa,
                    documento: {
                        codigoDocumento: pessoa.documento.codigoDocumento,
                        emissorDocumento: pessoa.documento.emissorDocumento,
                        tipoDocumento: pessoa.documento.tipoDocumento,
                        nome: pessoa.documento.nome
                    },
                    endereco: {
                        cep: pessoa.endereco.cep,
                        logradouro: pessoa.endereco.logradouro,
                        numero: pessoa.endereco.numero,
                        bairro: pessoa.endereco.bairro,
                        municipio: pessoa.endereco.municipio,
                        estado: pessoa.endereco.estado,
                        pais: pessoa.endereco.pais
                    }
                }
            };
        });
    }

    buildDocumentos(documentos) {
        if (!documentos) return [];

        return documentos.map(doc => ({
            '$attributes': {
                ...(doc.tipoDocumento && { 'tipoDocumento': doc.tipoDocumento }),
                ...(doc.dataHora && { 'dataHora': doc.dataHora }),
                'mimetype': doc.mimetype || 'application/pdf',
                ...(doc.nivelSigilo && { 'nivelSigilo': doc.nivelSigilo }),
                ...(doc.descricao && { 'descricao': doc.descricao })
            },
            'conteudo': doc.conteudo
        }));
    }
}

module.exports = new PeticaoInicialService(); 