  const Discord = require("discord.js");
const config = require('../../DataBaseJson/config.json');

module.exports = {
  name: "pagado",
  description: "🔨 | Mensaje Pagado",

  run: async (client, interaction) => {
    // ID del rol requerido
    const requiredRoleId = "1469967630365622403";

    // Verificar si el usuario tiene el rol
    const member = interaction.member;
    const hasRole = member.roles.cache.has(requiredRoleId);

    if (!hasRole) {
      return interaction.reply({ 
        content: "<:warninghost:1383935369275379874> | No tienes permiso para usar este comando.", 
        ephemeral: true 
      });
    }

    let bot = client.user.username;
    let avatar_bot = client.user.displayAvatarURL({ dynamic: true });

    // Cambiado a MessageEmbed (v13)
    let embed = new Discord.MessageEmbed()
      .setTitle("**__Pago Confirmado__**")
      .setColor(`${config.colorpredeterminado}`)
      .setTimestamp() // En v13 no necesita el 'new Date()' dentro
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter({ text: bot, iconURL: avatar_bot })
      .setDescription(
        `**✅ ¡Pago confirmado correctamente!**\n` +
        `Tu transacción ha sido registrada y tu pedido está en curso.\n\n` +

        `**🚚 Entrega en proceso**\n` +
        `> Un miembro de nuestro equipo <@&1469967630365622403> se encargará de entregarte tu producto en breve.\n` +
        `> **Por favor, evita mencionar al staff innecesariamente mientras se gestiona tu entrega.**\n\n` +

        `**🛠️ Soporte**\n` +
        `> Si tienes alguna duda o problema, contacta a nuestro equipo de soporte.\n` +
        `> Estamos disponibles para ayudarte en todo momento.\n\n` +

        `─────────────────────────\n\n` +

        `**✅ Payment successfully confirmed!**\n` +
        `Your transaction has been received and your order is being processed.\n\n` +

        `**🚚 Delivery in progress**\n` +
        `> A staff member <@&1469967630365622403> will handle the delivery shortly.\n` +
        `> **Please avoid tagging staff unnecessarily while your order is being fulfilled.**\n\n` +

        `**🛠️ Support**\n` +
        `> If you need any help or have questions, feel free to reach out to our support team.\n` +
        `> We’re here to assist you at any time.`
      );

    await interaction.reply({ embeds: [embed] });
  }
}