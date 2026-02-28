const Discord = require("discord.js");
// Verifica que la ruta a tu config.json sea correcta según tu carpeta
const config = require("../../DataBaseJson/config.json");

module.exports = {
  name: "ultra",
  description: "💎 | Asigna el rango de Ultra Customer a un usuario VIP.",
  options: [
    {
      name: "usuario",
      description: "Selecciona al usuario para otorgarle el rango Ultra.",
      type: "USER",
      required: true,
    },
  ],

  run: async (client, interaction) => {
    // 1. Evitamos que la interacción expire (Importante para evitar errores de respuesta)
    await interaction.deferReply({ ephemeral: true });

    try {
      // 2. Control de permisos del Staff
      if (!interaction.member.permissions.has("ADMINISTRATOR")) {
        return interaction.editReply({ 
            content: "❌ No tienes permisos de Administrador para otorgar rangos VIP." 
        });
      }

      const targetUser = interaction.options.getMember("usuario");
      
      // 3. Obtener el ID desde config.json (Asegúrate de tener "ultra": "ID" allí)
      const roleId = config.roles.ultra; 
      const role = interaction.guild.roles.cache.get(roleId);

      // 4. Validaciones de seguridad
      if (!role) {
        return interaction.editReply({ 
            content: "❌ Error: El rol de **Ultra Customer** no está configurado correctamente en `config.json`." 
        });
      }

      if (targetUser.roles.cache.has(role.id)) {
        return interaction.editReply({ 
            content: `⚠️ El usuario ${targetUser} ya posee el estatus de **Ultra Customer**.` 
        });
      }

      // 5. Asignación del rol
      await targetUser.roles.add(role);

      // 6. Embed Premium
      const embed = new Discord.MessageEmbed()
        .setTitle("✨ ¡NUEVO ULTRA CUSTOMER! ✨")
        .setDescription(`Se ha elevado el rango de ${targetUser} a **Ultra Customer** con éxito.`)
        .addFields(
            { name: "💎 Miembro VIP:", value: `${targetUser}`, inline: true },
            { name: "👑 Autorizado por:", value: `${interaction.user}`, inline: true },
            { name: "🛡️ Beneficios:", value: "Acceso exclusivo a funciones avanzadas.", inline: false }
        )
        .setColor("#F1C40F") // Color Oro / Dorado
        .setThumbnail("https://i.imgur.com/8Q9Z5Xm.png") // Opcional: puedes poner un emoji de diamante o tu logo
        .setFooter({ text: "710 Shop - Estatus VIP", iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error("Error en ultracustomer:", error);

      if (error.code === 50013) {
          return interaction.editReply({
            content: "❌ **Error de Jerarquía:** No puedo dar un rol que está por encima del mío. Sube mi rol de Bot en los ajustes del servidor.",
          });
      }

      return interaction.editReply({ 
          content: "❌ Error inesperado al procesar el rango Ultra." 
      });
    }
  },
};