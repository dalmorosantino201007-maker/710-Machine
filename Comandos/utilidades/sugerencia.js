const Discord = require("discord.js");
const config = require('../../DataBaseJson/config.json');

module.exports = {
  name: "sugerencia",
  description: "💡 | Envía una sugerencia al servidor",
  options: [
    {
      name: "contenido",
      description: "Contenido de la sugerencia",
      type: 3, // En v13, 3 corresponde a STRING
      required: true,
    },
  ],

  run: async (client, interaction) => {
    const suggestion = interaction.options.getString("contenido");
    const user = interaction.user;
    const guild = interaction.guild;

    const suggestionChannelId = "1469948677299634260"; 
    const channel = client.channels.cache.get(suggestionChannelId);

    // En v13 el tipo se verifica con el string 'GUILD_TEXT'
    if (!channel || channel.type !== 'GUILD_TEXT') {
      return interaction.reply({
        content: "❌ | No se pudo encontrar el canal de sugerencias o no es un canal de texto.",
        ephemeral: true,
      });
    }

    const embed = new Discord.MessageEmbed()
      .setColor(`${config.colorpredeterminado}`)
      .setTitle("📢 **¡__Nueva sugerencia__!**")
      .setDescription(`\`\`\`${suggestion}\`\`\``)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setFooter({
        text: "710 | Sistema de Sugerencias",
        iconURL: guild.iconURL({ dynamic: true }) || user.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    try {
      const msg = await channel.send({ embeds: [embed] });

      // Reacciones
      await msg.react("✅");
      await msg.react("❌");

      // En v13 startThread se ejecuta sobre el mensaje enviado
      const thread = await msg.startThread({
        name: `Debate: ${user.username}`,
        autoArchiveDuration: 1440,
        reason: "Hilo creado para debatir la sugerencia.",
      });

      await thread.send(`💬 ¡Discute aquí la sugerencia enviada por **${user.username}**!`);

      await interaction.reply({
        content: " | ¡Tu sugerencia ha sido enviada!",
        ephemeral: true,
      });
    } catch (err) {
      console.error("Error al enviar sugerencia:", err);
      return interaction.reply({
        content: " | Hubo un error al enviar la sugerencia.",
        ephemeral: true,
      });
    }
  }
};