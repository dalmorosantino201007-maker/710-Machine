const Discord = require("discord.js");
const config = require('../../DataBaseJson/config.json');

module.exports = {
  name: "serverinfo",
  description: "🔨 | Envía la información actual del servidor.",

  run: async (client, interaction) => {

    const nome = interaction.guild.name;
    const id = interaction.guild.id;
    const icon = interaction.guild.iconURL({ dynamic: true });
    const membros = interaction.guild.memberCount;

    const criacao = interaction.guild.createdAt.toLocaleDateString("es");
    
    // En v13 los tipos de canales se filtran por strings específicos
    const canais_total = interaction.guild.channels.cache.size;
    const canais_texto = interaction.guild.channels.cache.filter(c => c.type === 'GUILD_TEXT').size;
    const canais_voz = interaction.guild.channels.cache.filter(c => c.type === 'GUILD_VOICE').size;
    const canais_categoria = interaction.guild.channels.cache.filter(c => c.type === 'GUILD_CATEGORY').size;

    const color = `${config.colorpredeterminado}`;

    // Cambiado a MessageEmbed
    const embed1 = new Discord.MessageEmbed()
    .setColor(color)
    .setAuthor({ name: nome, iconURL: icon })
    .setThumbnail(icon)
    .addFields(
        {
            name: `💻 Nombre:`,
            value: `\`${nome}\``,
            inline: true
        },
        {
            name: `🆔 ID:`,
            value: `\`${id}\``,
            inline: true
        },
        {
            name: `👥 Miembros:`,
            value: `\`${membros}\``,
            inline: true
        },
        {
            name: `📅 Creacion:`,
            value: `\`${criacao}\``,
            inline: true
        },
        {
            name: `📤 Canales Totales:`,
            value: `\`${canais_total}\``,
            inline: true
        },
        {
            name: `📝 Canales de Texto:`,
            value: `\`${canais_texto}\``,
            inline: false
        },
        {
            name: `🔊 Canales de Voz:`,
            value: `\`${canais_voz}\``,
            inline: false
        },
        {
            name: `📅 Categorias:`,
            value: `\`${canais_categoria}\``,
            inline: false
        }
        
    );

    // Cambiado a MessageActionRow y MessageButton
    const botao = new Discord.MessageActionRow().addComponents(
        new Discord.MessageButton()
        .setURL(icon || "https://discord.com") // Fallback por si no hay icono
        .setLabel("Icono del Servidor")
        .setStyle('LINK') // En v13 se usa el string 'LINK'
    )

    interaction.reply({ embeds: [embed1], components: [botao] })
  }
}