const Discord = require("discord.js");
// Asegúrate de que la ruta a tu config.json sea la correcta
const config = require("../../DataBaseJson/config.json");

module.exports = {
  name: "customer",
  description: "👤 | Asigna el rango de Customer a un usuario.",
  options: [
    {
      name: "usuario",
      description: "Usuario al que quieres dar el rango de cliente.",
      type: "USER",
      required: true,
    },
  ],

  run: async (client, interaction) => {
    // 1. Evita que la interacción expire (Error 10062)
    await interaction.deferReply({ ephemeral: true });

    try {
      // 2. Verificar permisos de administrador
      if (!interaction.member.permissions.has("ADMINISTRATOR")) {
        return interaction.editReply({ 
            content: "❌ No tienes los permisos suficientes (ADMINISTRATOR) para usar este comando." 
        });
      }

      const targetUser = interaction.options.getMember("usuario");
      
      // 3. Obtener el ID desde el config.json
      // Asegúrate de que en config.json exista "customer": "ID_AQUI"
      const roleId = config.roles.customer; 
      const role = interaction.guild.roles.cache.get(roleId);

      // 4. Verificaciones de seguridad
      if (!role) {
        return interaction.editReply({ 
            content: "❌ No se encontró el rol de **Customer** configurado. Revisa el ID en `config.json`." 
        });
      }

      if (targetUser.roles.cache.has(role.id)) {
        return interaction.editReply({ 
            content: `⚠️ El usuario ${targetUser} ya tiene el rango de **Customer**.` 
        });
      }

      // 5. Asignar el rol
      await targetUser.roles.add(role);

      // 6. Embed de éxito
      const embed = new Discord.MessageEmbed()
        .setTitle("✅ Rango Asignado")
        .setDescription(`Se ha entregado el rango **${role.name}** correctamente.`)
        .addFields(
            { name: "👤 Cliente:", value: `${targetUser}`, inline: true },
            { name: "🛡️ Staff:", value: `${interaction.user}`, inline: true }
        )
        .setColor("#3498DB") // Azul para Customer
        .setThumbnail(targetUser.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "710 Shop - Sistema de Gestión", iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error("Error en comando customer:", error);

      if (error.code === 50013) {
          return interaction.editReply({
            content: "❌ **Error de Jerarquía:** Mi rol de bot debe estar **por encima** del rol Customer en los ajustes del servidor.",
          });
      }

      return interaction.editReply({ 
          content: "❌ Ocurrió un error inesperado al intentar asignar el rango." 
      });
    }
  },
};