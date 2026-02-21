const Discord = require("discord.js");
const axios = require("axios");
const config = require('../../DataBaseJson/config.json');

module.exports = {
  name: "conversion",
  description: "🔨 | Convierte entre distintas monedas (USD, BRL, EUR, CLP, UYU, ARS).",
  options: [
    {
      name: "cantidad",
      description: "Cantidad de dinero a convertir.",
      type: 10, // NUMBER en v13
      required: true,
    },
    {
      name: "moneda",
      description: "Moneda de origen.",
      type: 3, // STRING en v13
      required: true,
      choices: [
        { name: "🇦🇷 Peso Argentino (ARS)", value: "ars" },
        { name: "🇺🇸 Dólar (USD)", value: "usd" },
        { name: "🇧🇷 Real (BRL)", value: "brl" },
        { name: "🇪🇺 Euro (EUR)", value: "eur" },
        { name: "🇨🇱 Peso Chileno (CLP)", value: "clp" },
        { name: "🇺🇾 Peso Uruguayo (UYU)", value: "uyu" },
      ],
    },
    {
      name: "hacia",
      description: "Moneda destino.",
      type: 3, // STRING en v13
      required: true,
      choices: [
        { name: "🇦🇷 Peso Argentino (ARS)", value: "ars" },
        { name: "🇺🇸 Dólar (USD)", value: "usd" },
        { name: "🇧🇷 Real (BRL)", value: "brl" },
        { name: "🇪🇺 Euro (EUR)", value: "eur" },
        { name: "🇨🇱 Peso Chileno (CLP)", value: "clp" },
        { name: "🇺🇾 Peso Uruguayo (UYU)", value: "uyu" },
      ],
    },
  ],

  run: async (client, interaction) => {
    const cantidad = interaction.options.getNumber("cantidad");
    const monedaOrigen = interaction.options.getString("moneda");
    const monedaDestino = interaction.options.getString("hacia");

    if (monedaOrigen === monedaDestino) {
      return interaction.reply({
        content: "⚠️ | No puedes convertir a la misma moneda.",
        ephemeral: true,
      });
    }

    try {
      // Usando tu API Key proporcionada
      const response = await axios.get(
        `https://v6.exchangerate-api.com/v6/6d207d967c74439569e4b67a/latest/USD`
      );
      const rates = response.data.conversion_rates;

      const infoMoneda = {
        ars: { simbolo: "$", nombre: "Pesos Argentinos (ARS)", bandera: "🇦🇷" },
        usd: { simbolo: "USD$", nombre: "Dólares (USD)", bandera: "🇺🇸" },
        brl: { simbolo: "R$", nombre: "Reales (BRL)", bandera: "🇧🇷" },
        eur: { simbolo: "€", nombre: "Euros (EUR)", bandera: "🇪🇺" },
        clp: { simbolo: "CLP$", nombre: "Pesos Chilenos (CLP)", bandera: "🇨🇱" },
        uyu: { simbolo: "$U", nombre: "Pesos Uruguayos (UYU)", bandera: "🇺🇾" },
      };

      const tasas = {
        usd: rates.ARS,
        brl: rates.ARS / rates.BRL,
        eur: rates.ARS / rates.EUR,
        clp: rates.ARS / rates.CLP,
        uyu: rates.ARS / rates.UYU,
        ars: 1,
      };

      let resultado;
      if (monedaDestino === "ars") {
        resultado = cantidad * tasas[monedaOrigen];
      } else if (monedaOrigen === "ars") {
        resultado = cantidad / tasas[monedaDestino];
      } else {
        const enArs = cantidad * tasas[monedaOrigen];
        resultado = enArs / tasas[monedaDestino];
      }

      const formato = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

      // Cambiado a MessageEmbed (v13)
      const embed = new Discord.MessageEmbed()
        .setColor("#000001")
        .setTitle(`**🔄 __Conversión de Divisas__**`)
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .setDescription(
          `**${infoMoneda[monedaOrigen].bandera} ${infoMoneda[monedaOrigen].nombre}** ➝ **${infoMoneda[monedaDestino].bandera} ${infoMoneda[monedaDestino].nombre}**`)
        .addFields(
          { name: "• Cantidad:", value: `\`${infoMoneda[monedaOrigen].simbolo}${formato.format(cantidad)}\``, inline: true },
          { name: "• A convertir:", value: `${infoMoneda[monedaDestino].bandera} ${infoMoneda[monedaDestino].simbolo}`, inline: true },
          { name: "• Resultado Final:", value: `\`\`\`${infoMoneda[monedaDestino].simbolo}${formato.format(resultado)}\`\`\``, inline: false }
        )
        .setFooter({
          text: "Powered by ExchangeRate API",
          iconURL: client.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error al obtener la cotización:", error);
      await interaction.reply({
        content: "⚠️ | No se pudo obtener la cotización. Verifica la API o intenta más tarde.",
        ephemeral: true,
      });
    }
  },
};