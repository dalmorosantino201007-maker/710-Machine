const Discord = require("discord.js")
const config = require('../../DataBaseJson/config.json');

module.exports = {
  name: "say",
  description: "🔨 | ¿Que es lo que debo decir?",
  options: [
    {
        name: "embed",
        description: "Hablaré en Embed.",
        type: 3, // STRING en v13
        required: false,
    },
    {
        name: "normal",
        description: "Hablaré sin Embed.",
        type: 3, // STRING en v13
        required: false,
    }
],

  run: async (client, interaction) => {

    // En v13 usamos el string del permiso
    if (!interaction.member.permissions.has("MANAGE_MESSAGES")) {
        return interaction.reply({ content: `<:crosshost2:1384349772386664550> | No tienes permiso para utilizar este comando.`, ephemeral: true })
    } else {
        let embed_fala = interaction.options.getString("embed");
        let normal_fala = interaction.options.getString("normal");
        
        if (!embed_fala && !normal_fala) {
            return interaction.reply({ content: `Escribe al menos una de las opciones.`, ephemeral: true })
        } else {
            // Usamos caracteres invisibles para evitar errores si uno está vacío
            if (!embed_fala) embed_fala = "⠀";
            if (!normal_fala) normal_fala = "⠀";

            // Cambiado a MessageEmbed (v13)
            let embed = new Discord.MessageEmbed()
            .setColor(`${config.colorpredeterminado}`)
            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setDescription(embed_fala);

            if (embed_fala === "⠀") {
                await interaction.reply({ content: ` Su mensaje fue enviado!`, ephemeral: true })
                await interaction.channel.send({ content: `${normal_fala}` })
            } else if (normal_fala === "⠀") {
                await interaction.reply({ content: ` Su mensaje fue enviado!`, ephemeral: true })
                await interaction.channel.send({ embeds: [embed] })
            } else {
                await interaction.reply({ content: ` Su mensaje fue enviado!`, ephemeral: true })
                await interaction.channel.send({ content: `${normal_fala}`, embeds: [embed] })
            }
        }
    }
  }
}