const { MessageEmbed } = require("discord.js");
const path = require('path');
const config = require(path.join(process.cwd(), 'DataBaseJson', 'config.json'));

module.exports = {
  name: "pagorecibido",
  description: "💰 | Notificar un pago entrante",
  options: [
    {
      name: "monto",
      description: "Cantidad de dinero recibida (ej: $500)",
      type: "STRING",
      required: true
    },
    {
      name: "articulo",
      description: "Qué producto compró",
      type: "STRING",
      required: true
    },
    {
      name: "comprador",
      description: "El usuario que realizó el pago",
      type: "USER",
      required: true
    }
  ],

  run: async (client, interaction) => {
    // Verificación de permisos (Solo Administradores)
    if (!interaction.member.permissions.has("ADMINISTRATOR")) {
      return interaction.reply({ content: "❌ No tienes permisos para usar este comando.", ephemeral: true });
    }

    const monto = interaction.options.getString("monto");
    const articulo = interaction.options.getString("articulo");
    const comprador = interaction.options.getUser("comprador");

    // Buscamos el canal en la config
    const canalPagos = interaction.guild.channels.cache.get(config.canal_pagos);"1469970757428973568"
    if (!canalPagos) {
      return interaction.reply({ content: "❌ El canal de pagos no está configurado correctamente en config.json.", ephemeral: true });
    }

    const embedPago = new MessageEmbed()
      .setAuthor({ 
          name: `💸 Pago Confirmado | ${interaction.guild.name}`, 
          iconURL: interaction.guild.iconURL({ dynamic: true }) 
      })
      .setTitle("¡Se ha recibido un nuevo pago! ✨")
      .setColor("#FFD700") // Dorado para el dinero
      .setThumbnail("https://i.imgur.com/8FkP8hK.png") // Icono de bolsa de dinero opcional
      .addFields(
        { name: "👤 | Cliente", value: `${comprador} (\`${comprador.tag}\`)`, inline: true },
        { name: "💰 | Monto", value: `\`${monto}\``, inline: true },
        { name: "🛒 | Artículo", value: `> ${articulo}`, inline: false },
        { name: "📅 | Hora de Registro", value: `<t:${Math.floor(Date.now() / 1000)}:t>`, inline: true }
      )
      .setFooter({ 
          text: `Registrado por ${interaction.user.username}`, 
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }) 
      })
      .setTimestamp();

    try {
      await canalPagos.send({ embeds: [embedPago] });
      await interaction.reply({ content: `✅ Pago registrado con éxito en ${canalPagos}`, ephemeral: true });
    } catch (error) {
      console.error(error);
      interaction.reply({ content: "❌ Hubo un error al intentar enviar el mensaje.", ephemeral: true });
    }
  }
};