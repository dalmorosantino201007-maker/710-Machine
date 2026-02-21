const Discord = require("discord.js")
const config = require('../../DataBaseJson/config.json');

module.exports = {
  name: "dm",
  description: "🔨 | Le enviaré un mensaje directo a alguien por ti",
  options: [
    {
        name: "usuario",
        description: "Mencione un usuario.",
        type: 6, // USER en v13
        required: true,
    },
    {
        name: "mensaje",
        description: "Escribe algo para enviar.",
        type: 3, // STRING en v13
        required: true,
    }
  ],

  run: async (client, interaction) => {

    // En v13 usamos el string del permiso
    if (!interaction.member.permissions.has("MANAGE_GUILD")) {
        return interaction.reply({ 
          content: `<:warninghost:1383935369275379874> | No tienes permiso para usar este comando.`, 
          ephemeral: true 
        })
    }

    let user = interaction.options.getUser("usuario");
    let msg = interaction.options.getString("mensaje");

    // Cambiado a MessageEmbed (v13)
    let embed = new Discord.MessageEmbed()
      .setColor(`${config.colorpredeterminado}`)
      .setAuthor({ 
        name: interaction.user.username, 
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }) 
      })
      .setDescription(`${msg}`);

    user.send({ embeds: [embed] }).then(() => {
        let emb = new Discord.MessageEmbed()
          .setColor(`${config.colorpredeterminado}`)
          .setDescription(`✅ | Hola ${interaction.user}, ¡El mensaje fue enviado a ${user} con éxito!`);

        interaction.reply({ embeds: [emb] })
    }).catch(e => {
        let emb = new Discord.MessageEmbed()
          .setColor(`${config.colorpredeterminado}`)
          .setDescription(`❌ | Hola ${interaction.user}, el mensaje no fue enviado a ${user} porque tiene los MD cerrados.`);

        interaction.reply({ embeds: [emb] })
    })
  }
}