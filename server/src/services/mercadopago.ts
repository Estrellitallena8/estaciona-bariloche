import { MercadoPagoConfig, Preference, Payment as MPPayment } from "mercadopago";
import { env } from "../env";

let client: MercadoPagoConfig | null = null;

function getClient() {
  if (!client) {
    client = new MercadoPagoConfig({ accessToken: env.mpAccessToken });
  }
  return client;
}

export async function crearPreferencia(params: {
  sessionId: string;
  titulo: string;
  monto: number;
}) {
  const preference = new Preference(getClient());
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
        success: `${env.clientUrl}/ticket`,
        pending: `${env.clientUrl}/ticket`,
        failure: `${env.clientUrl}/pagar`,
      },
      auto_return: "approved",
      notification_url: undefined,
    },
  });
  return result;
}

export async function consultarPago(paymentId: string) {
  const payment = new MPPayment(getClient());
  return payment.get({ id: paymentId });
}
