const Discord = require("discord.js");

module.exports = (client) => {
    console.log('Módulo logs.js cargado para v13.');

    // ID del canal de logs
    const LOG_CHANNEL_ID = "1470928427199631412";

    // Función interna para enviar logs
    async function sendLog({ title, description, color = 0x3498db }) {
        try {
            const logChannel = client.channels.cache.get(LOG_CHANNEL_ID) || await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
            
            // En v13 comprobamos si el canal es de texto así:
            if (logChannel && (logChannel.type === 'GUILD_TEXT' || logChannel.type === 'message')) {
                const embed = new Discord.MessageEmbed()
                    .setTitle(title)
                    .setDescription(description)
                    .setColor(color)
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error al enviar el log:', error);
        }
    }

    // --- EVENTOS ---

    // Nuevo mensaje
    client.on('messageCreate', (message) => {
        if (!message.author || message.author.bot || !message.guild) return;
        sendLog({
            title: "📝 Nuevo Mensaje",
            description: `**Autor:** ${message.author.tag}\n**Canal:** <#${message.channel.id}>\n**Contenido:**\n\`\`\`${message.content || '*Sin contenido visible*'}\`\`\``,
            color: "#3498db"
        });
    });

    // Miembro entra
    client.on('guildMemberAdd', (member) => {
        sendLog({
            title: "📥 Nuevo Miembro",
            description: `**Usuario:** ${member.user.tag}\n**ID:** ${member.id}`,
            color: "#2ecc71"
        });
    });

    // Miembro sale
    client.on('guildMemberRemove', (member) => {
        sendLog({
            title: "📤 Miembro Salió",
            description: `**Usuario:** ${member.user.tag}\n**ID:** ${member.id}`,
            color: "#e74c3c"
        });
    });

    // Mensaje eliminado
    client.on('messageDelete', (message) => {
        if (message.partial || !message.guild || (message.author && message.author.bot)) return;
        sendLog({
            title: "🗑️ Mensaje Eliminado",
            description: `**Autor:** ${message.author ? message.author.tag : "Desconocido"}\n**Canal:** <#${message.channel.id}>\n**Contenido:**\n\`\`\`${message.content || '*Sin contenido visible*'}\`\`\``,
            color: "#f1c40f"
        });
    });

    // Mensaje editado
    client.on('messageUpdate', (oldMessage, newMessage) => {
        if (oldMessage.partial || newMessage.partial) return;
        if (oldMessage.content === newMessage.content) return;
        if (newMessage.author.bot) return;

        sendLog({
            title: "✏️ Mensaje Editado",
            description: `**Autor:** ${oldMessage.author.tag}\n**Canal:** <#${oldMessage.channel.id}>\n\n**Antes:**\n\`\`\`${oldMessage.content || '*Sin contenido*'}\`\`\`\n\n**Después:**\n\`\`\`${newMessage.content || '*Sin contenido*'}\`\`\``,
            color: "#ffa500"
        });
    });

    // Canal creado
    client.on('channelCreate', (channel) => {
        if (!channel.guild) return;
        sendLog({
            title: "📁 Canal Creado",
            description: `**Nombre:** ${channel.name}\n**Tipo:** ${channel.type}`,
            color: "#1abc9c"
        });
    });

    // Canal eliminado
    client.on('channelDelete', (channel) => {
        if (!channel.guild) return;
        sendLog({
            title: "🗂️ Canal Eliminado",
            description: `**Nombre:** ${channel.name}\n**Tipo:** ${channel.type}`,
            color: "#95a5a6"
        });
    });

    // Usuario baneado
    client.on('guildBanAdd', (ban) => {
        sendLog({
            title: "🔨 Usuario Baneado",
            description: `**Usuario:** ${ban.user.tag}\n**ID:** ${ban.user.id}`,
            color: "#c0392b"
        });
    });

    // Bot listo
    client.once('ready', () => {
        sendLog({
            title: "✅ Bot en Línea",
            description: `El sistema de logs se ha activado para **${client.user.tag}**.`,
            color: "#00bfff"
        });
    });
};