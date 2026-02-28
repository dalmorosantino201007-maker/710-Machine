const Discord = require("discord.js");

module.exports = {
  name: "setrole",
  description: "👤 | Añade un rol y cambia el apodo del usuario automáticamente.",
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
    // 1. Evitamos errores de tiempo de respuesta
    await interaction.deferReply({ ephemeral: true });

    try {
      // 2. Verificación de permisos
      if (!interaction.member.permissions.has("ADMINISTRATOR")) {
        return interaction.editReply({ content: "❌ No tienes permisos para usar este comando." });
      }

      const targetUser = interaction.options.getMember("usuario");
      const role = interaction.options.getRole("rol");

      if (!targetUser) return interaction.editReply({ content: "❌ Usuario no encontrado." });

      // 3. Añadir el rol
      await targetUser.roles.add(role);

      // 4. Lógica de Cambio de Apodo (Nickname)
      try {
          // Limpiamos el nombre del rol de símbolos extra si los tiene (opcional)
          const nombreRolLimpio = role.name.replace(/[.·|]/g, '').trim(); 
          const nombreBase = targetUser.user.username;
          
          // Formato: "Rol | Nombre" (Cortado a 32 caracteres máximo por límite de Discord)
          const nuevoApodo = `${nombreRolLimpio} | ${nombreBase}`.slice(0, 32);
          
          await targetUser.setNickname(nuevoApodo);
      } catch (nickError) {
          console.log("No se pudo cambiar el apodo (Jerarquía o permisos insuficientes).");
          // No detenemos el proceso, ya que el rol sí se añadió.
      }

      // 5. Confirmación
      const embed = new Discord.MessageEmbed()
        .setTitle("✅ Acción Completada")
        .setDescription(`Se ha asignado el rol ${role} y actualizado el apodo de ${targetUser}.`)
        .setColor("GREEN")
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      return interaction.editReply({ content: "❌ Ocurrió un error al intentar asignar el rol." });
    }
  },
};