const Discord = require("discord.js");

module.exports = {
  name: "setrole",
  description: "👤 | Añade un rol a un usuario rápidamente.",
  options: [
    {
      name: "usuario",
      description: "Selecciona al usuario.",
      type: "USER",
      required: true,
    },
    {
      name: "rol",
      description: "Selecciona el rol que quieres añadir.",
      type: "ROLE",
      required: true,
    },
  ],

  run: async (client, interaction) => {
    // 1. Usamos deferReply para evitar que la interacción expire (Error 10062)
    // Esto le dice a Discord que el bot está "pensando..."
    await interaction.deferReply({ ephemeral: true });

    try {
      // 2. Verificar permisos (Solo administradores)
      if (!interaction.member.permissions.has("ADMINISTRATOR")) {
        return interaction.editReply({
          content: "❌ No tienes permisos para usar este comando.",
        });
      }

      const targetUser = interaction.options.getMember("usuario");
      const role = interaction.options.getRole("rol");

      // 3. Verificaciones de seguridad
      if (!targetUser) {
        return interaction.editReply({ content: "❌ No se pudo encontrar al usuario en este servidor." });
      }

      if (role.managed) {
        return interaction.editReply({ content: "❌ No puedo asignar un rol que es gestionado por una integración (como el rol de otro bot)." });
      }

      // 4. Verificar si el usuario ya tiene el rol
      if (targetUser.roles.cache.has(role.id)) {
        return interaction.editReply({
          content: `⚠️ El usuario ${targetUser} ya tiene el rol **${role.name}**.`,
        });
      }

      // 5. Añadir el rol
      await targetUser.roles.add(role);

      // 6. Confirmación con un Embed profesional
      const embed = new Discord.MessageEmbed()
        .setTitle("✅ Rol Asignado")
        .setDescription(`Se ha añadido correctamente el rol ${role} a ${targetUser}.`)
        .addFields(
            { name: "👤 Usuario:", value: `${targetUser.user.tag}`, inline: true },
            { name: "🏷️ Rol:", value: `${role.name}`, inline: true }
        )
        .setColor("#2ECC71") // Verde Esmeralda
        .setFooter({ text: `Acción realizada por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      // Usamos editReply porque ya habíamos usado deferReply al principio
      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error("Error en setrole:", error);
      
      // Manejo específico de errores de permisos de Discord
      if (error.code === 50013) {
          return interaction.editReply({
            content: "❌ **Error de Permisos:** Mi rol debe estar **por encima** del rol que intentas dar en los ajustes del servidor.",
          });
      }

      return interaction.editReply({
        content: "❌ Ocurrió un error inesperado al intentar asignar el rol.",
      });
    }
  },
};