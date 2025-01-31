class ValidationService {
    validatePayload(payload) {
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
            throw {
                status: 400,
                error: 'Payload inválido. É necessário enviar um objeto JSON.'
            };
        }

        // Aqui você pode adicionar mais validações específicas
        this.validateRequiredFields(payload);
        this.validateDadosBasicos(payload.dadosBasicos);
        this.validateDocumentos(payload.documento);
    }

    validateRequiredFields(payload) {
        const requiredFields = ['idManifestante', 'senhaManifestante', 'dadosBasicos', 'documento', 'dataEnvio'];
        
        for (const field of requiredFields) {
            if (!payload[field]) {
                throw {
                    status: 400,
                    error: `Campo obrigatório não informado: ${field}`
                };
            }
        }
    }

    validateDadosBasicos(dadosBasicos) {
        if (!dadosBasicos) return;

        const requiredFields = ['classeProcessual', 'codigoLocalidade', 'polo'];
        
        for (const field of requiredFields) {
            if (!dadosBasicos[field]) {
                throw {
                    status: 400,
                    error: `Campo obrigatório não informado em dadosBasicos: ${field}`
                };
            }
        }
    }

    validateDocumentos(documentos) {
        if (!Array.isArray(documentos)) {
            throw {
                status: 400,
                error: 'O campo documento deve ser um array'
            };
        }

        documentos.forEach((doc, index) => {
            const requiredFields = ['tipoDocumento', 'conteudo'];
            
            for (const field of requiredFields) {
                if (!doc[field]) {
                    throw {
                        status: 400,
                        error: `Campo obrigatório não informado no documento ${index + 1}: ${field}`
                    };
                }
            }
        });
    }
}

module.exports = new ValidationService(); 