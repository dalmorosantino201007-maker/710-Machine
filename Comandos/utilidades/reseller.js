const Discord = require("discord.js");
const { JsonDatabase } = require("wio.db");
const config = new JsonDatabase({ databasePath: "./config.json" });

module.exports = {
  name: "reseller",
  description: "Asigna el rango de Reseller a un usuario",
  type: "CHAT_INPUT",
  options: [
    {
      name: "usuario",
      description: "El usuario que recibirá el rango",
      type: "USER",
      required: true
    }
  ],

  run: async (client, interaction, args) => {
    // 1. Verificar si quien usa el comando tiene permisos (Admin)
    if (!interaction.member.permissions.has("ADMINISTRATOR")) {
      return interaction.reply({ 
        content: "❌ No tienes permisos para usar este comando.", 
        ephemeral: true 
      });
    }

    const usuario = interaction.options.getMember("usuario");
    const rolID = config.get("roles.reseller"); // O .customer / .ultra

    // 2. Verificar si el usuario ya tiene el rango
    if (usuario.roles.cache.has(rolResellerID)) {
      return interaction.reply({ 
        content: `⚠️ ${usuario} ya es Reseller.`, 
        ephemeral: true 
      });
    }

    try {
      // 3. Dar el rol
      await usuario.roles.add(rolResellerID);

      // 4. Cambiar el apodo (Nickname)
      // Usamos .substring(0, 32) porque Discord no permite nombres más largos
      const nuevoNombre = `Reseller | ${usuario.user.username}`.substring(0, 32);
      await usuario.setNickname(nuevoNombre);

      // 5. Confirmación
      const embed = new Discord.MessageEmbed()
        .setTitle("✅ Nuevo Reseller Asignado")
        .setDescription(`El usuario ${usuario} ahora es un Reseller oficial.`)
        .addFields(
            { name: "👤 Usuario:", value: `${usuario.user.tag}`, inline: true },
            { name: "🏷️ Nuevo Apodo:", value: `\`${nuevoNombre}\``, inline: true }
        )
        .setColor(config.get("color") || "#00FF00")
        .setFooter({ text: `Acción realizada por ${interaction.user.username}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      interaction.reply({ 
        content: "❌ Hubo un error al intentar cambiar el rango o el nombre. Revisa si el bot tiene permisos de 'Gestionar Apodos' y si su rol está por encima del usuario.", 
        ephemeral: true 
      });
    }
  }
};