const Discord = require("discord.js");
const config = require('../../config.json');

module.exports = {
  name: "stopped-external-basic", // Nombre del comando
  description: "📦​ | Entrega Stopped External Basic", // Descripción
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: "key",
      description: "Ingrese la/s key(s).",
      type: Discord.ApplicationCommandOptionType.String,
      required: true,
    }
  ],

  run: async (client, interaction) => {
    // Verificar si el usuario tiene el rol requerido
    const requiredRoleId = `${config.eventas}`;"1469968666425823274"
    const member = interaction.member;
    const hasRole = member.roles.cache.has(requiredRoleId);"1469968666425823274"

    if (!hasRole) {
      return interaction.reply({ 
        content: "<:warninghost:1383935369275379874> | No tienes permiso para usar este comando.", 
        ephemeral: true 
      });
    }

    // Datos
    const bot = client.user.username;
    const avatar_bot = client.user.displayAvatarURL({ dynamic: true });
    const key = interaction.options.getString("key");

    // Embed de entrega
    const embed = new Discord.EmbedBuilder()
      .setTitle("¡Gracias por tu compra! 🎉")
      .setColor(config.colorpredeterminado)
      .setTimestamp()
      .setThumbnail("https://cdn.discordapp.com/attachments/1394073244323287212/1411607574557622352/image.png?ex=68b54580&is=68b3f400&hm=7c767d233529e7ae53b7878eb1212adb83eb2518fbb3295f9b2b894b7f6c5940&")
      .setFooter({ text: bot, iconURL: avatar_bot })
      .setDescription(
        `**•  __Producto__:** Stopped External Basic <:stopped:1376273781001158756>\n\n` +
        `**•  Key(s):** ||${key}||\n` +
        `**•  Download:** [Haz Click Aqui](https://discord.com/channels/1469618754282586154/1470994997456408703)\n` +
        `**•  Tutorial:** ||https://www.youtube.com/watch?v=NaLRszLuXKk||\n\n` +
        `Déjanos por favor un ${config.feedback} para poder seguir creciendo! <a:blackverify:1360058374456348846><:coramanos:1387181348069838942>`
      );

    // 1. Enviar mensaje ephemeral al usuario
    await interaction.reply({
      content: "✅ Producto entregado exitosamente.",
      ephemeral: true
    });

    // 2. Enviar embed públicamente al canal
    await interaction.channel.send({ embeds: [embed] });
  }
}