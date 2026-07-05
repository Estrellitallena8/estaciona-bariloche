"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crearPreferencia = crearPreferencia;
exports.consultarPago = consultarPago;
const mercadopago_1 = require("mercadopago");
const env_1 = require("../env");
let client = null;
function getClient() {
    if (!client) {
        client = new mercadopago_1.MercadoPagoConfig({ accessToken: env_1.env.mpAccessToken });
    }
    return client;
}
async function crearPreferencia(params) {
    const preference = new mercadopago_1.Preference(getClient());
    const result = await preference.create({
        body: {
            items: [
                {
                    id: params.sessionId,
                    title: params.titulo,
                    quantity: 1,
                    unit_price: params.monto,
                    currency_id: "ARS",
                },
            ],
            external_reference: params.sessionId,
            back_urls: {
                success: `${env_1.env.clientUrl}/ticket`,
                pending: `${env_1.env.clientUrl}/ticket`,
                failure: `${env_1.env.clientUrl}/pagar`,
            },
            auto_return: "approved",
            notification_url: undefined,
        },
    });
    return result;
}
async function consultarPago(paymentId) {
    const payment = new mercadopago_1.Payment(getClient());
    return payment.get({ id: paymentId });
}
//# sourceMappingURL=mercadopago.js.map