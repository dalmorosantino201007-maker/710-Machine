const Discord = require("discord.js")

const config = require("../../config.json")

module.exports = {
  name: "dm", // Coloque o nome do comando
  description: "🔨 | Le enviaré un mensaje directo a alguien por ti", // Coloque a descrição do comando
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
        name: "usuario",
        description: "Mencione un usuario.",
        type: Discord.ApplicationCommandOptionType.User,
        required: true,
    },
    {
        name: "mensaje",
        description: "Escribe algo para enviar.",
        type: Discord.ApplicationCommandOptionType.String,
        required: true,
    }
],

  run: async (client, interaction) => {

    if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
        interaction.reply({ content: `<:warninghost:1383935369275379874> | No tienes permiso para usar este comando.`, ephemeral: true })
    } else {
        let user = interaction.options.getUser("usuario");
        let msg = interaction.options.getString("mensaje");

        let embed = new Discord.EmbedBuilder()
        .setColor(`${config.colorpredeterminado}`)
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setDescription(`${msg}`);

        user.send({ embeds: [embed] }).then( () => {
            let emb = new Discord.EmbedBuilder()
            .setColor(`${config.colorpredeterminado}`)
            .setDescription(`✅ | Hola ${interaction.user}, El mensaje fue enviado a ${user} con exito!`);

            interaction.reply({ embeds: [emb] })
        }).catch(e => {
            let emb = new Discord.EmbedBuilder()
            .setColor(`${config.colorpredeterminado}`)
            .setDescription(`❌ | Hola ${interaction.user}, El mensaje no fue enviado a ${user}, ¡Porque el usuario tiene su DM cerrado!`);

            interaction.reply({ embeds: [emb] })
        })
    }


  }
}