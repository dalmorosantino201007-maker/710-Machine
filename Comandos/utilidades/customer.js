const Discord = require("discord.js");
const { JsonDatabase } = require("wio.db");
const config = new JsonDatabase({ databasePath: "./config.json" });

module.exports = {
  name: "customer",
  description: "Asigna el rango de Customer a un usuario",
  type: "CHAT_INPUT",
  options: [
    {
      name: "usuario",
      description: "El usuario que recibirá el rango de Cliente",
      type: "USER",
      required: true
    }
  ],

  run: async (client, interaction, args) => {
    // 1. Verificar si quien usa el comando es Admin
    if (!interaction.member.permissions.has("ADMINISTRATOR")) {
      return interaction.reply({ 
        content: "❌ No tienes permisos para usar este comando.", 
        ephemeral: true 
      });
    }

    const usuario = interaction.options.getMember("usuario");
    const rolID = config.get("roles.customer"); // O .customer / .ultra

    // 2. Verificar si el usuario ya es Customer
    if (usuario.roles.cache.has(rolCustomerID)) {
      return interaction.reply({ 
        content: `⚠️ ${usuario} ya tiene el rango de Customer.`, 
        ephemeral: true 
      });
    }

    try {
      // 3. Dar el rol de Customer
      await usuario.roles.add(rolCustomerID);

      // 4. Cambiar el apodo (Nickname)
      // Limitamos a 32 caracteres por restricción de Discord
      const nuevoNombre = `Customer | ${usuario.user.username}`.substring(0, 32);
      await usuario.setNickname(nuevoNombre);

      // 5. Confirmación con un Embed elegante
      const embed = new Discord.MessageEmbed()
        .setTitle("✅ Nuevo Customer Registrado")
        .setDescription(`¡Gracias por tu compra! ${usuario} ahora es un Cliente oficial.`)
        .addFields(
            { name: "👤 Usuario:", value: `${usuario.user.tag}`, inline: true },
            { name: "🏷️ Nuevo Apodo:", value: `\`${nuevoNombre}\``, inline: true }
        )
        .setColor("#3498DB") // Un azul para diferenciarlo del Reseller
        .setFooter({ text: `Acción por ${interaction.user.username}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      interaction.reply({ 
        content: "❌ No pude cambiar el rango o el nombre. Asegúrate de que mi rol esté **por encima** del usuario y del rol de Customer en los ajustes del servidor.", 
        ephemeral: true 
      });
    }
  }
};