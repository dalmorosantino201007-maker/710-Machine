require('dotenv').config();
const { Client, Collection, MessageEmbed, MessageActionRow, MessageButton, Modal, TextInputComponent, MessageSelectMenu } = require('discord.js');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const transcripts = require('discord-html-transcripts'); // Librería para transcripciones
const config = require('./DataBaseJson/config.json');

moment.locale('es');

const client = new Client({
    intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "GUILD_VOICE_STATES", "GUILD_PRESENCES", "GUILD_BANS", "DIRECT_MESSAGES"],
    partials: ["MESSAGE", "CHANNEL", "REACTION", "USER", "GUILD_MEMBER"],
});

client.slashCommands = new Collection();
require('./handler')(client);

// --- 🛠️ CONFIGURACIÓN DE IDs ---
const rolPermitidoId = "1469967630365622403"; 
const canalLogsId = "1470928427199631412"; 
const canalTranscriptsId = "1473454832567320768"; // Canal de Transcripciones
const canalReviewsId = "1475613791252119684";     // Canal de Calificaciones

const CATEGORIAS = {
    COMPRA: "1469945642909438114",  
    SOPORTE: "1469621686155346042", 
    PARTNER: "1471010330229477528"  
};

// --- IMPORTAR BIENVENIDAS ---
const welcomePath = path.join(__dirname, 'Events', 'welcome.js');
if (fs.existsSync(welcomePath)) {
    require('./Events/welcome')(client);
    console.log("✅ welcome.js cargado correctamente desde /Events/");
} else {
    console.log("⚠️ No se encontró welcome.js en ./Events/welcome.js");
}

const enviarLog = (embed) => {
    const canal = client.channels.cache.get(canalLogsId);
    if (canal) canal.send({ embeds: [embed] }).catch(() => {});
};

// ==========================================
// 🕹️ LÓGICA DE INTERACCIONES
// ==========================================

client.on('interactionCreate', async (interaction) => {
    
    if (interaction.isCommand()) {
        const cmd = client.slashCommands.get(interaction.commandName);
        if (cmd) try { await cmd.run(client, interaction); } catch (e) { console.error(e); }
        return;
    }

    // --- LÓGICA DE CALIFICACIÓN POR MENÚ ---
    if (interaction.isSelectMenu() && interaction.customId === "calificar_staff") {
        const nota = interaction.values[0];
        const estrellas = "⭐".repeat(parseInt(nota));
        
        const embedReview = new MessageEmbed()
            .setTitle("🌟 Nueva Calificación de Usuario")
            .setColor("YELLOW")
            .addFields(
                { name: "Usuario", value: `${interaction.user.tag}`, inline: true },
                { name: "Puntuación", value: `${nota}/5 ${estrellas}`, inline: true }
            )
            .setTimestamp();

        const canalReviews = interaction.guild ? interaction.guild.channels.cache.get(canalReviewsId) : client.channels.cache.get(canalReviewsId);
        if (canalReviews) canalReviews.send({ embeds: [embedReview] });
        
        return interaction.reply({ content: `✅ ¡Gracias! Has calificado el servicio con ${nota} estrellas.`, ephemeral: true });
    }

    if (interaction.isButton()) {
        const { customId, member, user, channel, guild } = interaction;

        if (customId === "copiar_cvu") return interaction.reply({ content: "0000003100072461415651", ephemeral: true });
        if (customId === "copiar_alias") return interaction.reply({ content: "710shop", ephemeral: true });

        // --- LÓGICA DE PARTNER ROL (CORREGIDA) ---
        if (customId === "partner_rol") {
            const rolId = "1470862847671140412"; // Tu ID de rol de Partner
            const rol = guild.roles.cache.get(rolId);

            if (!rol) {
                return interaction.reply({ content: "❌ Error: El rol de Partner no existe o el ID es incorrecto.", ephemeral: true });
            }

            try {
                if (member.roles.cache.has(rolId)) {
                    await member.roles.remove(rolId);
                    return interaction.reply({ content: "✅ Se te ha quitado el rol de **Partner**.", ephemeral: true });
                } else {
                    await member.roles.add(rolId);
                    return interaction.reply({ content: "✅ ¡Verificado! Ahora tienes el rol de **Partner**.", ephemeral: true });
                }
            } catch (error) {
                console.error("Error al gestionar rol:", error);
                return interaction.reply({ content: "❌ No puedo darte el rol. Asegúrate de que mi rol esté **por encima** del de Partner en la lista de roles.", ephemeral: true });
            }
        }

        // --- GESTIÓN DE TICKETS ---
        if (customId === "asumir") {
            if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ No tienes permiso.", ephemeral: true });
            await interaction.reply({ content: `✅ El Staff ${user} ha asumido este ticket.` });
            await channel.setName(`atendido-${user.username}`).catch(() => {});
            enviarLog(new MessageEmbed().setTitle("📌 Ticket Asumido").setDescription(`**Staff:** ${user.tag}\n**Canal:** ${channel}`).setColor("PURPLE").setTimestamp());
        }

        if (customId === "notificar") {
            if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ No tienes permiso.", ephemeral: true });
            return interaction.reply({ content: `🔔 ${user} ha enviado una notificación de atención.` });
        }

        // --- CIERRE DE TICKET ---
        if (customId === "fechar_ticket") {
            if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ No tienes permiso.", ephemeral: true });

            await interaction.reply({ content: "⏳ Generando transcripción y enviando al usuario...", ephemeral: true });

            try {
                const ticketOwnerPerms = channel.permissionOverwrites.cache.find(p => p.type === 'member' && p.id !== client.user.id);
                const attachment = await transcripts.createTranscript(channel, {
                    limit: -1,
                    fileName: `transcript-${channel.name}.html`,
                    poweredBy: false
                });

                const canalTrans = guild.channels.cache.get(canalTranscriptsId);
                if (canalTrans) {
                    const logEmbed = new MessageEmbed()
                        .setTitle("📄 Transcripción de Ticket")
                        .setColor("#2f3136")
                        .addFields(
                            { name: "Canal", value: `${channel.name}`, inline: true },
                            { name: "Cerrado por", value: `${user.tag}`, inline: true },
                            { name: "Dueño", value: ticketOwnerPerms ? `<@${ticketOwnerPerms.id}>` : "Desconocido", inline: true }
                        )
                        .setTimestamp();
                    await canalTrans.send({ embeds: [logEmbed], files: [attachment] });
                }

                if (ticketOwnerPerms) {
                    const targetUser = await client.users.fetch(ticketOwnerPerms.id).catch(() => null);
                    if (targetUser) {
                        const embedInfo = new MessageEmbed()
                            .setAuthor({ name: "Host | Machine", iconURL: guild.iconURL() })
                            .setTitle(`Ticket Cerrado | #${channel.name.split('-')[2] || "Ticket"}`)
                            .setColor("#2b2d31")
                            .setDescription("Este ticket ha sido cerrado correctamente y su transcripción fue enviada.")
                            .addFields(
                                { name: "👤 Ticket Abierto Por", value: `<@${targetUser.id}>`, inline: true },
                                { name: "🛠️ Ticket Cerrado Por", value: `${user.tag}`, inline: true },
                                { name: "🕒 Fecha de cierre", value: moment().format('LLLL'), inline: false },
                                { name: "📄 Nota", value: "No se proporcionaron notas adicionales." }
                            )
                            .setFooter({ text: "Host | Sistema de Tickets", iconURL: guild.iconURL() })
                            .setTimestamp();

                        const embedEncuesta = new MessageEmbed()
                            .setAuthor({ name: "Host | Machine", iconURL: guild.iconURL() })
                            .setTitle("📝 Encuesta de Satisfacción - Soporte Automático")
                            .setColor("#2b2d31")
                            .setDescription("Tu ticket fue cerrado correctamente. Agradecemos tu tiempo. Por favor, califica tu experiencia.")
                            .addFields(
                                { name: "🎫 Ticket", value: `#${channel.name.split('-')[2] || "Ticket"}`, inline: true },
                                { name: "📂 Canal", value: `${channel.name}`, inline: true },
                                { name: "👨‍💼 Staff", value: `<@${user.id}>`, inline: true }
                            )
                            .setFooter({ text: "Host | Sistema de Tickets", iconURL: guild.iconURL() });

                        const rowMenu = new MessageActionRow().addComponents(
                            new MessageSelectMenu()
                                .setCustomId("calificar_staff")
                                .setPlaceholder("Selecciona tu calificación (1-5)")
                                .addOptions([
                                    { label: "1 - Muy Malo", value: "1", emoji: "⭐" },
                                    { label: "2 - Malo", value: "2", emoji: "⭐" },
                                    { label: "3 - Regular", value: "3", emoji: "⭐" },
                                    { label: "4 - Bueno", value: "4", emoji: "⭐" },
                                    { label: "5 - Excelente", value: "5", emoji: "⭐" },
                                ])
                        );

                        await targetUser.send({
                            content: `Tu ticket (**${channel.name}**) ha sido cerrado. Aquí tienes el transcript:`,
                            files: [attachment],
                            embeds: [embedInfo, embedEncuesta],
                            components: [rowMenu]
                        }).catch(() => {});
                    }
                }

                enviarLog(new MessageEmbed().setTitle("🔒 Ticket Cerrado").setDescription(`**Staff:** ${user.tag}\n**Canal:** ${channel.name}`).setColor("ORANGE").setTimestamp());
                setTimeout(() => channel.delete().catch(() => {}), 5000);

            } catch (error) {
                console.error(error);
                interaction.followUp({ content: "❌ Error al procesar el cierre.", ephemeral: true });
            }
        }

        // --- APERTURA DE MODALES (COMPRA, SOPORTE, PARTNER) ---
        if (customId === "ticket_compra") {
            const modal = new Modal().setCustomId('modal_compra').setTitle('Formulario de Compra');
            modal.addComponents(
                new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_prod').setLabel("¿Que deseas comprar?").setStyle('SHORT').setRequired(true)),
                new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_metodo').setLabel("¿Que metodos de pagos usaras?").setStyle('SHORT').setRequired(true)),
                new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_cant').setLabel("¿Cantidad que deseas comprar?").setStyle('SHORT').setRequired(true))
            );
            return await interaction.showModal(modal);
        }

        if (customId === "ticket_soporte") {
            const modal = new Modal().setCustomId('modal_soporte').setTitle('Centro de Soporte');
            modal.addComponents(new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_duda').setLabel("¿En que necesitas Ayuda?").setStyle('PARAGRAPH').setRequired(true)));
            return await interaction.showModal(modal);
        }

        if (customId === "ticket_partner") {
            const modal = new Modal().setCustomId('modal_partner').setTitle('Solicitud de Partner');
            modal.addComponents(
                new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_add').setLabel("Ya añadiste nuestro add?").setStyle('SHORT').setRequired(true)),
                new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_link').setLabel("Manda aqui el link de tu server").setStyle('SHORT').setRequired(true))
            );
            return await interaction.showModal(modal);
        }
    }

    // --- MANEJO DE ENVÍO DE MODALES ---
    if (interaction.isModalSubmit()) {
        
        // --- NUEVA LÓGICA: MODAL DE ANUNCIO (EMBED) ---
        if (interaction.customId === 'modalanuncio_v2') {
            await interaction.deferReply({ ephemeral: true });
            const titulo = interaction.fields.getTextInputValue('titulo');
            const descripcion = interaction.fields.getTextInputValue('desc');
            const thumbnail = interaction.fields.getTextInputValue('thumbnail');
            const banner = interaction.fields.getTextInputValue('banner');
            const color = interaction.fields.getTextInputValue('cor');

            try {
                const embedPersonalizado = new MessageEmbed()
                    .setDescription(descripcion)
                    .setColor(color.startsWith('#') ? color : `#${color}`);

                if (titulo) embedPersonalizado.setTitle(titulo);
                if (thumbnail && thumbnail.startsWith('http')) embedPersonalizado.setThumbnail(thumbnail);
                if (banner && banner.startsWith('http')) embedPersonalizado.setImage(banner);

                await interaction.channel.send({ embeds: [embedPersonalizado] });
                return interaction.editReply({ content: "✅ Embed enviado correctamente." });
            } catch (e) {
                return interaction.editReply({ content: "❌ Error al crear el embed. Revisa los links o el color HEX." });
            }
        }

        // --- LÓGICA DE TICKETS EXISTENTE ---
        await interaction.deferReply({ ephemeral: true });
        let cateId, tipoTicket, nombreCanal, camposPersonalizados = [];

        if (interaction.customId === 'modal_compra') {
            cateId = CATEGORIAS.COMPRA; tipoTicket = "Compras"; nombreCanal = `🛒-compra-${interaction.user.username}`;
            camposPersonalizados = [
                { name: "📦 Producto", value: interaction.fields.getTextInputValue('p_prod'), inline: true },
                { name: "💳 Método", value: interaction.fields.getTextInputValue('p_metodo'), inline: true },
                { name: "🔢 Cantidad", value: interaction.fields.getTextInputValue('p_cant'), inline: true }
            ];
        } else if (interaction.customId === 'modal_soporte') {
            cateId = CATEGORIAS.SOPORTE; tipoTicket = "Soporte"; nombreCanal = `🛠️-soporte-${interaction.user.username}`;
            camposPersonalizados = [{ name: "❓ Ayuda", value: interaction.fields.getTextInputValue('p_duda') }];
        } else if (interaction.customId === 'modal_partner') {
            cateId = CATEGORIAS.PARTNER; tipoTicket = "Partner"; nombreCanal = `🤝-partner-${interaction.user.username}`;
            camposPersonalizados = [
                { name: "✅ Add añadido", value: interaction.fields.getTextInputValue('p_add'), inline: true },
                { name: "🔗 Link", value: interaction.fields.getTextInputValue('p_link'), inline: true }
            ];
        }

        try {
            const canal = await interaction.guild.channels.create(nombreCanal, {
                type: 'GUILD_TEXT',
                parent: cateId,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: ['VIEW_CHANNEL'] },
                    { id: interaction.user.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES'] },
                    { id: rolPermitidoId, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] }
                ]
            });

            const ticketID = Math.floor(Math.random() * 900000) + 100000;
            const embedTicket = new MessageEmbed()
                .setTitle("SISTEMA DE TICKETS")
                .setColor("#2f3136")
                .setDescription(`¡Bienvenido/a ${interaction.user}! El Staff te atenderá pronto.\n\n**Compra Aqui/Buy here🔎**`)
                .addFields(
                    { name: "Categoría", value: tipoTicket, inline: true },
                    { name: "ID del Ticket", value: `\`${ticketID}\``, inline: true },
                    { name: "Usuario", value: `${interaction.user.tag}` }
                )
                .addFields(camposPersonalizados)
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: "710 Shop - Gestión de Tickets" })
                .setTimestamp();

            const row = new MessageActionRow().addComponents(
                new MessageButton().setCustomId("fechar_ticket").setLabel("Cerrar").setStyle("DANGER").setEmoji("🔒"),
                new MessageButton().setCustomId("asumir").setLabel("Asumir").setStyle("SUCCESS").setEmoji("✅"),
                new MessageButton().setCustomId("notificar").setLabel("Notificar").setStyle("SECONDARY").setEmoji("📢")
            );

            await canal.send({ content: `${interaction.user} | <@&${rolPermitidoId}>`, embeds: [embedTicket], components: [row] });
            await interaction.editReply({ content: `✅ Ticket creado: ${canal}` });
            enviarLog(new MessageEmbed().setTitle("🎫 Ticket Abierto").setDescription(`**Usuario:** ${interaction.user.tag}\n**Canal:** ${canal}`).setColor("BLUE").setTimestamp());
        } catch (e) {
            console.error(e);
            await interaction.editReply({ content: "❌ Error al crear el ticket." });
        }
    }
});

// ==========================================
// 🔥 SISTEMA DE VIGILANCIA
// ==========================================

client.on('messageCreate', m => {
    if (!m.guild || m.author.bot || m.channel.id === canalLogsId) return;
    enviarLog(new MessageEmbed().setAuthor({ name: `Mensaje: ${m.author.tag}`, iconURL: m.author.displayAvatarURL() }).setColor("#2f3136").setDescription(`**Canal:** ${m.channel}\n**Contenido:**\n${m.content || "*[Archivo/Embed]*"}`).setTimestamp());
});

client.on('messageDelete', m => {
    if (!m.guild || m.author?.bot) return;
    enviarLog(new MessageEmbed().setTitle("🗑️ Mensaje Borrado").setColor("#ff0000").addFields({ name: "Autor", value: `${m.author.tag}`, inline: true }, { name: "Canal", value: `${m.channel}`, inline: true }, { name: "Contenido", value: `\`\`\`${m.content || "Sin texto"}\`\`\`` }).setTimestamp());
});

client.on('messageUpdate', (o, n) => {
    if (o.author?.bot || o.content === n.content) return;
    enviarLog(new MessageEmbed().setTitle("✏️ Mensaje Editado").setColor("#ffff00").addFields({ name: "Autor", value: `${o.author.tag}`, inline: true }, { name: "Antes", value: `\`\`\`${o.content}\`\`\`` }, { name: "Después", value: `\`\`\`${n.content}\`\`\`` }).setTimestamp());
});

client.on('guildMemberAdd', m => {
    enviarLog(new MessageEmbed().setTitle("📥 Miembro Nuevo").setColor("#00ff00").setDescription(`**${m.user.tag}** entró al servidor.`).setTimestamp());
});

client.on('guildMemberRemove', m => {
    enviarLog(new MessageEmbed().setTitle("📤 Miembro Salió").setColor("#ff4500").setDescription(`**${m.user.tag}** abandonó el servidor.`).setTimestamp());
});

client.on('ready', async () => { 
    console.log(`🔥 ${client.user.username} - VIGILANCIA Y TICKETS ACTIVADOS`); 
    const canalLogs = client.channels.cache.get(canalLogsId);
    if (canalLogs) canalLogs.send({ content: "710 Bot se ha iniciado correctamente 🔥" }).catch(() => {});
});

client.login(process.env.TOKEN || config.token);