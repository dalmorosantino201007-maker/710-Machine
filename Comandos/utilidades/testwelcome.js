const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");

module.exports = {
    name: "testwelcome",
    description: "Prueba el sistema de bienvenida en el canal actual",
    // Importante: Si tu handler usa 'run' o 'execute', asegúrate de que coincida
    run: async (client, interaction) => {
        
        // Solo administradores pueden testear
        if (!interaction.member.permissions.has("ADMINISTRATOR")) {
            return interaction.reply({ 
                content: "❌ No tienes permisos para usar este comando.", 
                ephemeral: true 
            });
        }

        const member = interaction.member;
        const guild = interaction.guild;

        // Respuesta inicial para que la interacción no expire
        await interaction.reply({ content: "⏳ Generando prueba de bienvenida...", ephemeral: true });

        // --- DISEÑO DEL EMBED (Igual al de tu welcome.js) ---
        const embedwelcome = new MessageEmbed()
            .setColor("#000001")
            .setTitle(`¡Bienvenido a ${guild.name}™! (PRUEBA)`)
            .setDescription(`¡Hola ${member}, estamos emocionados de tenerte aquí! 💬`)
            .addFields(
                { name: '👤 Usuario:', value: `${member.user.username}`, inline: false },
                { name: '📅 Cuenta creada el:', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`, inline: false },
                { name: '🕒 Se unió al servidor el:', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
                { name: '👥 Total de miembros:', value: `${guild.memberCount}`, inline: false },
                { name: '📖 Términos del servidor:', value: `Revisa nuestras términos en <#1469950357785546853>` }
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setFooter({ 
                text: `¡Ahora somos ${guild.memberCount} miembros!`, 
                iconURL: guild.iconURL({ dynamic: true }) 
            })
            .setTimestamp();

        // 1. Enviar al canal actual
        try {
            await interaction.channel.send({
                content: `👋 ¡Bienvenido/a ${member}! (Esto es una prueba del sistema)`,
                embeds: [embedwelcome]
            });
        } catch (error) {
            console.error("Error al enviar al canal:", error);
        }

        // 2. Enviar por MD (Privado)
        const dmEmbed = new MessageEmbed()
            .setColor('#000001')
            .setTitle(`¡Bienvenido/a a ${guild.name}! (PRUEBA DM)`)
            .setDescription(`¡Hola ${member}! Así verán los usuarios su mensaje de bienvenida privado.\n\n:mag: ¡**Atención**! Visita:\n:one: **Información**: <#1469950357785546853>`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setFooter({ text: `Bienvenid@ a ${guild.name}`, iconURL: guild.iconURL({ dynamic: true }) })
            .setTimestamp();

        const buttonRow = new MessageActionRow().addComponents(
            new MessageButton().setLabel('Discord Developer').setStyle('LINK').setURL('https://discord.gg/r6yP9CPKSt').setEmoji('🚀'),
            new MessageButton().setLabel('Youtube Host').setStyle('LINK').setURL('https://www.youtube.com/@HostStore1').setEmoji('📺')
        );

        try {
            await member.send({ embeds: [dmEmbed], components: [buttonRow] });
            await interaction.editReply({ content: "✅ Prueba completada con éxito (Canal + MD)." });
        } catch (e) {
            await interaction.editReply({ content: "✅ Prueba enviada al canal, pero tus MD están cerrados." });
        }
    }
};