class SoapMethodService {
    async executeSoapMethod(client, methodName, payload) {
        return new Promise((resolve, reject) => {
            if (!client[methodName]) {
                reject({
                    status: 400,
                    error: `Método SOAP não encontrado: ${methodName}`
                });
                return;
            }

            client[methodName](payload, (err, result, envelope, soapHeader) => {
                if (err) {
                    reject({
                        error: 'Erro na chamada SOAP',
                        faultcode: err.root?.Envelope?.Body?.Fault?.faultcode || err.code,
                        faultstring: err.root?.Envelope?.Body?.Fault?.faultstring || err.message,
                        details: err.root?.Envelope?.Body?.Fault?.detail || err.detail
                    });
                    return;
                }

                const response = this.extractResponseData(envelope);
                resolve(response);
            });
        });
    }

    extractResponseData(envelope) {
        // Extrair informações do envelope usando expressões regulares
        const sucessoMatch = envelope.match(/<sucesso>(.*?)<\/sucesso>/);
        const mensagemMatch = envelope.match(/<mensagem>(.*?)<\/mensagem>/);
        const protocoloMatch = envelope.match(/<protocoloRecebimento>(.*?)<\/protocoloRecebimento>/);
        const dataMatch = envelope.match(/<dataOperacao>(.*?)<\/dataOperacao>/);
        
        return {
            // success: true,
            // resultado: {
                sucesso: sucessoMatch ? sucessoMatch[1] === 'true' : false,
                mensagem: mensagemMatch ? mensagemMatch[1] : '',
                protocoloRecebimento: protocoloMatch ? protocoloMatch[1] : '',
                dataOperacao: dataMatch ? dataMatch[1] : '',
            // }
        };
    }
}

module.exports = new SoapMethodService(); 