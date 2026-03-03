const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add')
        .setDescription('Añade a un usuario al ticket actual.')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('El usuario que quieres añadir')
                .setRequired(true)),

    async run(client, interaction) {
        // 1. Verificar si estamos en un ticket (consultando tu DB de sqlite)
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database('./DataBaseJson/tickets.db');

        db.get(`SELECT * FROM tickets WHERE channelId = ?`, [interaction.channel.id], async (err, ticket) => {
            if (err) return console.error(err);

            // Si el canal no está en la base de datos, no es un ticket
            if (!ticket) {
                return interaction.reply({ 
                    content: "❌ Este comando solo puede usarse dentro de un ticket activo.", 
                    ephemeral: true 
                });
            }

            const usuario = interaction.options.getMember('usuario');
            const rolPermitidoId = "1469967630365622403"; // Tu ID de Staff

            // 2. Verificar permisos (Solo el Staff o el Creador del ticket pueden añadir gente)
            if (!interaction.member.roles.cache.has(rolPermitidoId) && interaction.user.id !== ticket.creatorId) {
                return interaction.reply({ 
                    content: "❌ No tienes permiso para añadir personas a este ticket.", 
                    ephemeral: true 
                });
            }

            try {
                // 3. Modificar los permisos del canal para el nuevo usuario
                await interaction.channel.permissionOverwrites.edit(usuario.id, {
                    VIEW_CHANNEL: true,
                    SEND_MESSAGES: true,
                    ATTACH_FILES: true,
                    EMBED_LINKS: true
                });

                const embed = new MessageEmbed()
                    .setTitle("👤 Usuario Añadido")
                    .setDescription(`El usuario ${usuario} ha sido añadido al ticket por ${interaction.user}.`)
                    .setColor("GREEN")
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });

            } catch (error) {
                console.error(error);
                return interaction.reply({ 
                    content: "❌ Hubo un error al intentar añadir al usuario.", 
                    ephemeral: true 
                });
            }
        });
    }
};