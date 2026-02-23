require('dotenv').config();
const { Client, Collection, MessageEmbed, MessageActionRow, MessageButton, Modal, TextInputComponent } = require('discord.js');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const config = require('./DataBaseJson/config.json');

moment.locale('es');

const client = new Client({
    intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "GUILD_VOICE_STATES", "GUILD_PRESENCES", "GUILD_BANS"],
    partials: ["MESSAGE", "CHANNEL", "REACTION", "USER", "GUILD_MEMBER"],
});

client.slashCommands = new Collection();
require('./handler')(client);

// --- 🛠️ CONFIGURACIÓN DE IDs ---
const rolPermitidoId = "1469967630365622403"; 
const canalLogsId = "1470928427199631412"; 

const CATEGORIAS = {
    COMPRA: "1469945642909438114",  
    SOPORTE: "1469621686155346042", 
    PARTNER: "1471010330229477528"  
};

// --- IMPORTAR BIENVENIDAS (Ruta corregida a carpeta Events) ---
const welcomePath = path.join(__dirname, 'Events', 'welcome.js');
if (fs.existsSync(welcomePath)) {
    require('./Events/welcome')(client);
    console.log("✅ welcome.js cargado correctamente desde /Events/");
} else {
    console.log("⚠️ No se encontró welcome.js en ./Events/welcome.js (Revisa que la carpeta se llame Events)");
}

// --- FUNCIÓN PARA ENVIAR LOGS ---
const enviarLog = (embed) => {
    const canal = client.channels.cache.get(canalLogsId);
    if (canal) canal.send({ embeds: [embed] }).catch(() => {});
};

// ==========================================
// 🕹️ LÓGICA DE INTERACCIONES (TICKETS Y MÁS)
// ==========================================

client.on('interactionCreate', async (interaction) => {
    
    if (interaction.isCommand()) {
        const cmd = client.slashCommands.get(interaction.commandName);
        if (cmd) try { await cmd.run(client, interaction); } catch (e) { console.error(e); }
        return;
    }

    if (interaction.isButton()) {
        const { customId, member, user, channel } = interaction;

        if (customId === "copiar_cvu") return interaction.reply({ content: "0000003100072461415651", ephemeral: true });
        if (customId === "copiar_alias") return interaction.reply({ content: "710shop", ephemeral: true });

        // GESTIÓN DE TICKETS
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

        if (customId === "fechar_ticket") {
            if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ No tienes permiso.", ephemeral: true });
            enviarLog(new MessageEmbed().setTitle("🔒 Ticket Cerrado").setDescription(`**Staff:** ${user.tag}\n**Canal:** ${channel.name}`).setColor("ORANGE").setTimestamp());
            await interaction.reply("🔒 Cerrando ticket en 3 segundos...");
            setTimeout(() => channel.delete().catch(() => {}), 3000);
        }

        // APERTURA DE MODALES
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

    if (interaction.isModalSubmit()) {
        await interaction.deferReply({ ephemeral: true });
        
        let cateId, tipoTicket, nombreCanal, camposPersonalizados = [];

        if (interaction.customId === 'modal_compra') {
            cateId = CATEGORIAS.COMPRA;
            tipoTicket = "Compras";
            nombreCanal = `🛒-compra-${interaction.user.username}`;
            camposPersonalizados = [
                { name: "📦 Producto", value: interaction.fields.getTextInputValue('p_prod'), inline: true },
                { name: "💳 Método", value: interaction.fields.getTextInputValue('p_metodo'), inline: true },
                { name: "🔢 Cantidad", value: interaction.fields.getTextInputValue('p_cant'), inline: true }
            ];
        } else if (interaction.customId === 'modal_soporte') {
            cateId = CATEGORIAS.SOPORTE;
            tipoTicket = "Soporte";
            nombreCanal = `🛠️-soporte-${interaction.user.username}`;
            camposPersonalizados = [{ name: "❓ Ayuda", value: interaction.fields.getTextInputValue('p_duda') }];
        } else if (interaction.customId === 'modal_partner') {
            cateId = CATEGORIAS.PARTNER;
            tipoTicket = "Partner";
            nombreCanal = `🤝-partner-${interaction.user.username}`;
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
            const fecha = moment().format('dddd, D [de] MMMM [de] YYYY HH:mm');

            const embedTicket = new MessageEmbed()
                .setTitle("SISTEMA DE TICKETS")
                .setColor("#2f3136")
                .setDescription(`¡Bienvenido/a ${interaction.user}! El Staff te atenderá pronto.\n\n**Compra Aqui/Buy here🔎**`)
                .addFields(
                    { name: "Categoría", value: tipoTicket, inline: true },
                    { name: "ID del Ticket", value: `\`${ticketID}\``, inline: true },
                    { name: "Fecha", value: `\`${fecha}\``, inline: true },
                    { name: "Usuario", value: `${interaction.user.tag} (${interaction.user.id})` }
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
            
            enviarLog(new MessageEmbed().setTitle("🎫 Ticket Abierto").setDescription(`**Usuario:** ${interaction.user.tag}\n**Tipo:** ${tipoTicket}\n**Canal:** ${canal}`).setColor("BLUE").setTimestamp());

        } catch (e) {
            console.error(e);
            await interaction.editReply({ content: "❌ Error al crear el ticket." });
        }
    }
});

// ==========================================
// 🔥 SISTEMA DE VIGILANCIA TOTAL 🔥
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

client.on('guildMemberUpdate', (o, n) => {
    const oR = o.roles.cache, nR = n.roles.cache;
    if (oR.size < nR.size) {
        const role = nR.filter(r => !oR.has(r.id)).first();
        enviarLog(new MessageEmbed().setTitle("➕ Rol Añadido").setColor("#2ecc71").setDescription(`A **${n.user.tag}** se le asignó el rol ${role}`).setTimestamp());
    } else if (oR.size > nR.size) {
        const role = oR.filter(r => !nR.has(r.id)).first();
        enviarLog(new MessageEmbed().setTitle("➖ Rol Quitado").setColor("#e74c3c").setDescription(`A **${n.user.tag}** se le quitó el rol ${role}`).setTimestamp());
    }
});

client.on('roleCreate', r => enviarLog(new MessageEmbed().setTitle("🆕 Rol Creado").setColor("#3498db").setDescription(`Nombre: ${r.name}`).setTimestamp()));
client.on('roleDelete', r => enviarLog(new MessageEmbed().setTitle("🗑️ Rol Eliminado").setColor("#c0392b").setDescription(`Nombre: ${r.name}`).setTimestamp()));

client.on('channelCreate', c => enviarLog(new MessageEmbed().setTitle("🆕 Canal Creado").setColor("#1abc9c").setDescription(`Canal: ${c.name}`).setTimestamp()));
client.on('channelDelete', c => enviarLog(new MessageEmbed().setTitle("🗑️ Canal Borrado").setColor("#e67e22").setDescription(`Nombre: ${c.name}`).setTimestamp()));

client.on('voiceStateUpdate', (o, n) => {
    let e = new MessageEmbed().setColor("#9b59b6").setTimestamp();
    if (!o.channelId && n.channelId) enviarLog(e.setTitle("🔊 Voz: Conexión").setDescription(`${n.member.user.tag} entró a ${n.channel}`));
    else if (o.channelId && !n.channelId) enviarLog(e.setTitle("🔇 Voz: Desconexión").setDescription(`${o.member.user.tag} salió de ${o.channel.name}`));
});

client.on('guildBanAdd', b => enviarLog(new MessageEmbed().setTitle("🔨 Usuario Baneado").setColor("#000000").setDescription(`**${b.user.tag}** fue baneado.`).setTimestamp()));

client.on('ready', async () => { 
    console.log(`🔥 ${client.user.username} - VIGILANCIA Y TICKETS ACTIVADOS`); 
    
    // MENSAJE DE INICIO EN EL CANAL DE LOGS
    const canalLogs = client.channels.cache.get(canalLogsId);
    if (canalLogs) {
        canalLogs.send({ content: "710 Bot se ha iniciado correctamente 🔥" }).catch(e => console.error("Error al enviar log de inicio:", e));
    }
});

client.login(process.env.TOKEN || config.token);