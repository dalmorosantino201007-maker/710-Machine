require('dotenv').config();
const { Client, Collection, MessageEmbed, MessageActionRow, MessageButton, Modal, TextInputComponent } = require('discord.js');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const config = require('./DataBaseJson/config.json');

moment.locale('es');

const client = new Client({
    intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "GUILD_VOICE_STATES", "GUILD_PRESENCES"],
    partials: ["MESSAGE", "CHANNEL", "REACTION", "USER", "GUILD_MEMBER"],
});

client.slashCommands = new Collection();
require('./handler')(client);

// --- 🛠️ CONFIGURACIÓN DE IDs (Actualizadas) ---
const rolPermitidoId = "1469967630365622403"; 
const canalLogsId = "1473454832567320768"; 

const CATEGORIAS = {
    COMPRA: "1469945642909438114",  
    SOPORTE: "1469621686155346042", 
    PARTNER: "1471010330229477528"  
};

// --- FUNCIÓN PARA ENVIAR LOGS ---
const enviarLog = (embed) => {
    const canal = client.channels.cache.get(canalLogsId);
    if (canal) canal.send({ embeds: [embed] }).catch(() => {});
};

// --- LÓGICA DE INTERACCIONES ---
client.on('interactionCreate', async (interaction) => {
    
    // Slash Commands
    if (interaction.isCommand()) {
        const cmd = client.slashCommands.get(interaction.commandName);
        if (cmd) try { await cmd.run(client, interaction); } catch (e) { console.error(e); }
        return;
    }

    // Botones
    if (interaction.isButton()) {
        const { customId, member, user, channel } = interaction;

        if (customId === "copiar_cvu") return interaction.reply({ content: "0000003100072461415651", ephemeral: true });
        if (customId === "copiar_alias") return interaction.reply({ content: "710shop", ephemeral: true });

        if (customId === "ticket_compra") {
            const modal = new Modal().setCustomId('modal_compra').setTitle('Formulario de Compra');
            const p = new TextInputComponent().setCustomId('p_prod').setLabel("Producto a comprar").setStyle('SHORT').setRequired(true);
            const m = new TextInputComponent().setCustomId('p_metodo').setLabel("Método (ARS, USD, Crypto)").setStyle('SHORT').setRequired(true);
            modal.addComponents(new MessageActionRow().addComponents(p), new MessageActionRow().addComponents(m));
            return await interaction.showModal(modal);
        }

        if (customId === "ticket_soporte") {
            const modal = new Modal().setCustomId('modal_soporte').setTitle('Centro de Soporte');
            const p = new TextInputComponent().setCustomId('p_duda').setLabel("Describe tu problema").setStyle('PARAGRAPH').setRequired(true);
            modal.addComponents(new MessageActionRow().addComponents(p));
            return await interaction.showModal(modal);
        }

        if (customId === "ticket_partner") {
            const modal = new Modal().setCustomId('modal_partner').setTitle('Solicitud de Partner');
            const p = new TextInputComponent().setCustomId('p_propuesta').setLabel("Cuéntanos tu propuesta").setStyle('PARAGRAPH').setRequired(true);
            modal.addComponents(new MessageActionRow().addComponents(p));
            return await interaction.showModal(modal);
        }

        if (customId === "fechar_ticket") {
            if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ Solo el Staff puede cerrar tickets.", ephemeral: true });
            enviarLog(new MessageEmbed().setTitle("🔒 Ticket Cerrado").setDescription(`**Staff:** ${user.tag}\n**Canal:** ${channel.name}`).setColor("ORANGE").setTimestamp());
            await interaction.reply("🔒 Cerrando ticket en 3 segundos...");
            setTimeout(() => channel.delete().catch(() => {}), 3000);
        }
    }

    // Modals
    if (interaction.isModalSubmit()) {
        
        // --- MODAL DE EMBED PERSONALIZADO ---
        if (interaction.customId === 'modalanuncio_v2') {
            await interaction.deferReply({ ephemeral: true });
            const titulo = interaction.fields.getTextInputValue('titulo');
            const desc = interaction.fields.getTextInputValue('desc');
            const thumb = interaction.fields.getTextInputValue('thumbnail');
            const banner = interaction.fields.getTextInputValue('banner');
            const color = interaction.fields.getTextInputValue('cor') || "#5865F2";

            const embedUser = new MessageEmbed()
                .setTitle(titulo || "")
                .setDescription(desc)
                .setColor(color.startsWith('#') ? color : `#${color}`)
                .setTimestamp();

            if (thumb && thumb.startsWith('http')) embedUser.setThumbnail(thumb);
            if (banner && banner.startsWith('http')) embedUser.setImage(banner);

            await interaction.channel.send({ embeds: [embedUser] });
            return await interaction.editReply({ content: "✅ Embed enviado correctamente." });
        }

        // --- LÓGICA DE TICKETS ---
        await interaction.deferReply({ ephemeral: true });
        
        let cateId = "";
        let tipoTicket = "";
        let nombreCanal = "";
        let camposInfo = [];

        if (interaction.customId === 'modal_compra') {
            cateId = CATEGORIAS.COMPRA;
            tipoTicket = "Compras";
            nombreCanal = `🛒-compra-${interaction.user.username}`;
            camposInfo = [
                { name: "📦 Producto", value: interaction.fields.getTextInputValue('p_prod'), inline: true },
                { name: "💳 Método", value: interaction.fields.getTextInputValue('p_metodo'), inline: true }
            ];
        } else if (interaction.customId === 'modal_soporte') {
            cateId = CATEGORIAS.SOPORTE;
            tipoTicket = "Soporte";
            nombreCanal = `🛠️-soporte-${interaction.user.username}`;
            camposInfo = [{ name: "❓ Problema", value: interaction.fields.getTextInputValue('p_duda') }];
        } else if (interaction.customId === 'modal_partner') {
            cateId = CATEGORIAS.PARTNER;
            tipoTicket = "Partner";
            nombreCanal = `🤝-partner-${interaction.user.username}`;
            camposInfo = [{ name: "📝 Propuesta", value: interaction.fields.getTextInputValue('p_propuesta') }];
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

            const ticketID = Math.floor(Math.random() * 90000000000000) + 10000000000000;
            const fecha = moment().format('dddd, D [de] MMMM [de] YYYY HH:mm');

            const embedBienvenida = new MessageEmbed()
                .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() })
                .setTitle("SISTEMA DE TICKETS")
                .setColor("#5865F2")
                .setDescription(`¡Bienvenido/a ${interaction.user}! El Staff te atenderá pronto.`)
                .addFields(
                    { name: "Categoría", value: tipoTicket, inline: true },
                    { name: "ID del Ticket", value: `\`${ticketID}\``, inline: true },
                    { name: "Fecha", value: `\`${fecha}\``, inline: true }
                )
                .addFields(camposInfo)
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: "710 Shop - Gestión de Tickets" });

            const botones = new MessageActionRow().addComponents(
                new MessageButton().setCustomId("fechar_ticket").setLabel("Cerrar").setStyle("DANGER").setEmoji("🔒"),
                new MessageButton().setCustomId("asumir").setLabel("Asumir").setStyle("SUCCESS").setEmoji("✅"),
                new MessageButton().setCustomId("notificar").setLabel("Notificar").setStyle("SECONDARY").setEmoji("📢")
            );

            await canal.send({ content: `${interaction.user} | <@&${rolPermitidoId}>`, embeds: [embedBienvenida], components: [botones] });
            await interaction.editReply({ content: `✅ Ticket creado: ${canal}` });
            
            enviarLog(new MessageEmbed().setTitle("🎫 Ticket Abierto").setDescription(`**Usuario:** ${interaction.user.tag}\n**Tipo:** ${tipoTicket}\n**Canal:** ${canal}`).setColor("BLUE").setTimestamp());

        } catch (e) {
            console.error(e);
            await interaction.editReply({ content: "❌ Error al crear el canal. Revisa los permisos del bot." });
        }
    }
});

// --- 🕵️‍♂️ SISTEMA DE LOGS ---
client.on('messageDelete', m => {
    if (!m.guild || m.author?.bot) return;
    enviarLog(new MessageEmbed().setTitle("🗑️ Mensaje Borrado").setColor("RED").addFields(
        { name: "Autor", value: `${m.author?.tag || "Unknown"}`, inline: true },
        { name: "Canal", value: `${m.channel}`, inline: true },
        { name: "Contenido", value: `\`\`\`${m.content || "Sin texto/Imagen"}\`\`\`` }
    ).setTimestamp());
});

client.on('messageUpdate', (o, n) => {
    if (o.author?.bot || o.content === n.content) return;
    enviarLog(new MessageEmbed().setTitle("✏️ Mensaje Editado").setColor("YELLOW").addFields(
        { name: "Autor", value: `${o.author.tag}`, inline: true },
        { name: "Antes", value: `\`\`\`${o.content}\`\`\`` },
        { name: "Después", value: `\`\`\`${n.content}\`\`\`` }
    ).setTimestamp());
});

client.on('guildMemberAdd', m => enviarLog(new MessageEmbed().setTitle("📥 Miembro Nuevo").setColor("GREEN").setDescription(`**${m.user.tag}** se unió al servidor.`).setThumbnail(m.user.displayAvatarURL()).setTimestamp()));
client.on('guildMemberRemove', m => enviarLog(new MessageEmbed().setTitle("📤 Miembro Salió").setColor("RED").setDescription(`**${m.user.tag}** abandonó el servidor.`).setTimestamp()));

client.on('voiceStateUpdate', (o, n) => {
    let e = new MessageEmbed().setColor("AQUA").setTimestamp();
    if (!o.channelId && n.channelId) enviarLog(e.setTitle("🔊 Voz: Conexión").setDescription(`${n.member.user.tag} entró a ${n.channel.name}`));
    else if (o.channelId && !n.channelId) enviarLog(e.setTitle("🔇 Voz: Desconexión").setDescription(`${o.member.user.tag} salió de ${o.channel.name}`));
});

// --- ENCENDIDO DEL BOT ---
client.on('ready', () => { 
    console.log(`🔥 ${client.user.username} - SISTEMA PRO ACTIVADO`); 
    const canalLogs = client.channels.cache.get(canalLogsId);"1470928427199631412"
    if (canalLogs) {
        const embedOnline = new MessageEmbed()
            .setTitle("✅ Bot Online")
            .setDescription("El bot **710 Shop** está actualmente online 🔥")
            .setColor("#00FF00")
            .setTimestamp();
        canalLogs.send({ embeds: [embedOnline] }).catch(console.error);
    }
});

client.login(process.env.TOKEN || config.token);