const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = (client) => {
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        try {
            // Verifica si hay cambio en el estado de boost
            // En v13 premiumSince es nulo si no boostea
            const wasBooster = !!oldMember.premiumSince;
            const isBooster = !!newMember.premiumSince;

            // Debug para consola
            console.log('Detectando cambio de boost:', { wasBooster, isBooster, user: newMember.user.tag });

            // Si el usuario acaba de boostear
            if (!wasBooster && isBooster) {
                const guild = newMember.guild;
                // ID del canal de boosts
                const boostChannel = await guild.channels.cache.get('1469948899245686836');

                if (!boostChannel) {
                    console.warn('Canal de boost no encontrado o no está en caché.');
                    return;
                }

                // Embed de agradecimiento (v13 usa MessageEmbed)
                const embedBoost = new MessageEmbed()
                    .setTitle('🚀 ¡Gracias por apoyar el servidor!')
                    .setDescription(`¡Gracias <@${newMember.user.id}>! Tu apoyo nos ayuda a seguir creciendo y mejorando esta comunidad.\n\n**Beneficios exclusivos para boosters:**\n- <a:boost:1384359597837385799> Rango especial en el servidor.\n- 🚀 Acceso a 1 canale privado.\n- 📁 Carpeta exclusiva.\n\nHaz click en el botón de abajo para abrir un ticket de soporte y reclamar tus recompensas.`)
                    .setColor('#000001')
                    .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
                    .setTimestamp();

                // Fila de componentes (v13 usa MessageActionRow)
                const row = new MessageActionRow().addComponents(
                    new MessageButton()
                        .setLabel('Reclamar Recompensas')
                        .setStyle('LINK') // En v13 se usa string en mayúsculas
                        .setURL('https://discord.com/channels/1469618754282586154/1469861946135416872')
                );

                // Enviar mensaje al canal
                await boostChannel.send({ embeds: [embedBoost], components: [row] });
                console.log(`Mensaje de boost enviado correctamente a ${newMember.user.tag}`);
            }
        } catch (err) {
            console.error('Error al procesar guildMemberUpdate:', err);
        }
    });
};