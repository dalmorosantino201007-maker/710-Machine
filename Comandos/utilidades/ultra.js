const Discord = require("discord.js");
const { JsonDatabase } = require("wio.db");
const config = new JsonDatabase({ databasePath: "./config.json" });

module.exports = {
  name: "ultra",
  description: "Asigna el rango de Ultra Customer a un usuario",
  type: "CHAT_INPUT",
  options: [
    {
      name: "usuario",
      description: "El usuario que será Ultra Customer",
      type: "USER",
      required: true
    }
  ],

  run: async (client, interaction, args) => {
    // 1. Verificar permisos (Solo Admins)
    if (!interaction.member.permissions.has("ADMINISTRATOR")) {
      return interaction.reply({ 
        content: "❌ No tienes permisos para usar este comando.", 
        ephemeral: true 
      });
    }

    const usuario = interaction.options.getMember("usuario");
    const rolID = config.get("roles.ultra"); // O .customer / .ultra

    if (!usuario) {
        return interaction.reply({ content: "❌ No pude encontrar a ese usuario.", ephemeral: true });
    }

    try {
      // 2. Dar el rol
      await usuario.roles.add(rolUltraID);

      // 3. Cambiar el apodo exactamente como pediste
      // Formato: Ultra Customer | Nombre
      const nuevoNombre = `Ultra Customer | ${usuario.user.username}`.substring(0, 32);
      await usuario.setNickname(nuevoNombre);

      // 4. Mensaje de éxito
      const embed = new Discord.MessageEmbed()
        .setTitle("✨ ¡NIVEL ULTRA ALCANZADO! ✨")
        .setDescription(`El usuario ${usuario} ha sido ascendido con éxito.`)
        .addFields(
            { name: "👤 Usuario:", value: `${usuario.user.tag}`, inline: true },
            { name: "👑 Rango:", value: `**Ultra Customer**`, inline: true },
            { name: "🏷️ Nuevo Apodo:", value: `\`${nuevoNombre}\``, inline: false }
        )
        .setColor("#FFD700") // Color Oro
        .setThumbnail(usuario.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `Sistema de Rangos - ${interaction.user.username}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      interaction.reply({ 
        content: "❌ **Error de Permisos:** Mi rol debe estar por ENCIMA del rol de Ultra Customer y del usuario en los ajustes del servidor para poder cambiarle el nombre.", 
        ephemeral: true 
      });
    }
  }
};