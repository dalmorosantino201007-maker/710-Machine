const Discord = require("discord.js");
const config = require('../../DataBaseJson/config.json');

module.exports = {
  name: "stopped-external-basic",
  description: "📦 | Entrega Stopped External Basic",
  options: [
    {
      name: "key",
      description: "Ingrese la/s key(s).",
      type: 3, // Tipo STRING en v13
      required: true,
    }
  ],

  run: async (client, interaction) => {
    // ID del rol requerido (Limpiado para evitar errores de sintaxis)
    const requiredRoleId = "1469968666425823274";

    // Verificar si el miembro tiene el rol
    if (!interaction.member.roles.cache.has(requiredRoleId)) {
      return interaction.reply({ 
        content: "<:warninghost:1383935369275379874> | No tienes permiso para usar este comando.", 
        ephemeral: true 
      });
    }

    const botName = client.user.username;
    const botAvatar = client.user.displayAvatarURL({ dynamic: true });
    const key = interaction.options.getString("key");

    // MessageEmbed adaptado a v13
    const embed = new Discord.MessageEmbed()
      .setTitle("¡Gracias por tu compra! 🎉")
      .setColor(config.colorpredeterminado)
      .setTimestamp()
      .setThumbnail("https://cdn.discordapp.com/attachments/1394073244323287212/1411607574557622352/image.png")
      .setFooter(botName, botAvatar) // Formato v13: (texto, icono)
      .setDescription(
        `**•  __Producto__:** Stopped External Basic <:stopped:1376273781001158756>\n\n` +
        `**•  Key(s):** ||${key}||\n` +
        `**•  Download:** [Haz Click Aqui](https://discord.com/channels/1469618754282586154/1470994997456408703)\n` +
        `**•  Tutorial:** ||https://www.youtube.com/watch?v=NaLRszLuXKk||\n\n` +
        `Déjanos por favor un ${config.feedback} para poder seguir creciendo! <a:blackverify:1360058374456348846><:coramanos:1387181348069838942>`
      );

    // 1. Confirmación efímera para el staff
    await interaction.reply({
      content: "✅ Producto entregado exitosamente.",
      ephemeral: true
    });

    // 2. Envío del producto al canal
    await interaction.channel.send({ embeds: [embed] });
  }
};