const Discord = require("discord.js");

module.exports = {
  name: "ping",
  description: "📡 | Muestra la latencia del bot",

  run: async (client, interaction) => {
    // Calculamos la latencia local comparando el tiempo actual con el de la interacción
    const latency = Date.now() - interaction.createdTimestamp;
    // El ping de la API (Websocket)
    const apiPing = client.ws.ping;

    // Usamos MessageEmbed (v13)
    const embed = new Discord.MessageEmbed()
      .setTitle("🏓 Pong!")
      .setColor("#5865F2")
      .addFields(
        { name: "📶 Latencia del Bot", value: `\`${latency}ms\``, inline: true },
        { name: "💻 Ping de la API", value: `\`${apiPing}ms\``, inline: true }
      )
      .setFooter(
        `Solicitado por ${interaction.user.tag}`, 
        interaction.user.displayAvatarURL({ dynamic: true })
      )
      .setTimestamp();

    // Respondemos de forma efímera
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};