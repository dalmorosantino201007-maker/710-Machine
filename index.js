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

// --- IMPORTAR BIENVENIDAS ---
try {
    require('./events/welcome')(client); 
} catch (e) {
    console.log("⚠️ No se pudo cargar welcome.js, revisa la ruta del archivo.");
}

// --- FUNCIÓN PARA ENVIAR LOGS ---
const enviarLog = (embed) => {
    const canal = client.channels.cache.get(canalLogsId);
    if (canal) canal.send({ embeds: [embed] }).catch(() => {});
};

// ==========================================
// 🕹️ LÓGICA DE INTERACCIONES (TICKETS)
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

        if (customId === "asumir") {
            if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ No tienes permiso.", ephemeral: true });
            await interaction.reply({ content: `✅ Staff ${user} asumió el ticket.` });
            await channel.setName(`atendido-${user.username}`).catch(() => {});
            
            enviarLog(new MessageEmbed()
                .setTitle("📌 Ticket Asumido")
                .setDescription(`**Staff:** ${user.tag}\n**Canal:** ${channel}`)
                .setColor("PURPLE").setTimestamp());
        }

        if (customId === "fechar_ticket") {
            if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ No tienes permiso.", ephemeral: true });
            
            enviarLog(new MessageEmbed()
                .setTitle("🔒 Ticket Cerrado")
                .setDescription(`**Staff:** ${user.tag}\n**Canal:** ${channel.name}`)
                .setColor("ORANGE").setTimestamp());

            await interaction.reply("🔒 Cerrando ticket...");
            setTimeout(() => channel.delete().catch(() => {}), 3000);
        }

        // Abrir Modales
        if (customId === "ticket_compra") {
            const modal = new Modal().setCustomId('modal_compra').setTitle('Formulario de Compra');
            modal.addComponents(
                new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_prod').setLabel("Producto").setStyle('SHORT').setRequired(true)),
                new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_metodo').setLabel("Método").setStyle('SHORT').setRequired(true))
            );
            return await interaction.showModal(modal);
        }

        if (customId === "ticket_soporte") {
            const modal = new Modal().setCustomId('modal_soporte').setTitle('Centro de Soporte');
            modal.addComponents(new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_duda').setLabel("Problema").setStyle('PARAGRAPH').setRequired(true)));
            return await interaction.showModal(modal);
        }
    }

    if (interaction.isModalSubmit()) {
        await interaction.deferReply({ ephemeral: true });
        
        let cateId = "";
        let tipoTicket = "";
        let nombreCanal = "";
        let camposLog = "";

        if (interaction.customId === 'modal_compra') {
            cateId = CATEGORIAS.COMPRA;
            tipoTicket = "Compras";
            nombreCanal = `🛒-compra-${interaction.user.username}`;
            camposLog = `**Producto:** ${interaction.fields.getTextInputValue('p_prod')}\n**Método:** ${interaction.fields.getTextInputValue('p_metodo')}`;
        } else if (interaction.customId === 'modal_soporte') {
            cateId = CATEGORIAS.SOPORTE;
            tipoTicket = "Soporte";
            nombreCanal = `🛠️-soporte-${interaction.user.username}`;
            camposLog = `**Problema:** ${interaction.fields.getTextInputValue('p_duda')}`;
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

            const embedBienvenida = new MessageEmbed()
                .setTitle("SISTEMA DE TICKETS")
                .setColor("#5865F2")
                .setDescription(`¡Bienvenido/a ${interaction.user}! El Staff te atenderá pronto.\n\n${camposLog}`)
                .setFooter({ text: "710 Shop - Gestión de Tickets" });

            const botones = new MessageActionRow().addComponents(
                new MessageButton().setCustomId("fechar_ticket").setLabel("Cerrar").setStyle("DANGER").setEmoji("🔒"),
                new MessageButton().setCustomId("asumir").setLabel("Asumir").setStyle("SUCCESS").setEmoji("✅")
            );

            await canal.send({ content: `${interaction.user} | <@&${rolPermitidoId}>`, embeds: [embedBienvenida], components: [botones] });
            await interaction.editReply({ content: `✅ Ticket creado: ${canal}` });
            
            // LOG DE APERTURA
            enviarLog(new MessageEmbed()
                .setTitle("🎫 Nuevo Ticket Creado")
                .setColor("BLUE")
                .addFields(
                    { name: "Usuario", value: `${interaction.user.tag}`, inline: true },
                    { name: "Tipo", value: tipoTicket, inline: true },
                    { name: "Info", value: camposLog }
                ).setTimestamp());

        } catch (e) {
            console.error(e);
            await interaction.editReply({ content: "❌ Error al crear el ticket." });
        }
    }
});

// ==========================================
// 🔥 SISTEMA DE LOGS DE DISCORD 🔥
// ==========================================

client.on('messageCreate', m => {
    if (!m.guild || m.author.bot || m.channel.id === canalLogsId) return;
    enviarLog(new MessageEmbed()
        .setAuthor({ name: `Mensaje: ${m.author.tag}`, iconURL: m.author.displayAvatarURL() })
        .setColor("#2f3136")
        .setDescription(`**Canal:** ${m.channel}\n**Contenido:**\n${m.content || "*[Archivo]*"}`)
        .setTimestamp());
});

client.on('messageDelete', m => {
    if (!m.guild || m.author?.bot) return;
    enviarLog(new MessageEmbed().setTitle("🗑️ Mensaje Borrado").setColor("#ff0000").addFields(
        { name: "Autor", value: `${m.author.tag}`, inline: true },
        { name: "Canal", value: `${m.channel}`, inline: true },
        { name: "Contenido", value: `\`\`\`${m.content || "Sin texto"}\`\`\`` }
    ).setTimestamp());
});

client.on('messageUpdate', (o, n) => {
    if (o.author?.bot || o.content === n.content) return;
    enviarLog(new MessageEmbed().setTitle("✏️ Mensaje Editado").setColor("#ffff00").addFields(
        { name: "Autor", value: `${o.author.tag}`, inline: true },
        { name: "Antes", value: `\`\`\`${o.content}\`\`\`` },
        { name: "Después", value: `\`\`\`${n.content}\`\`\`` }
    ).setTimestamp());
});

client.on('guildMemberUpdate', (o, n) => {
    const oR = o.roles.cache, nR = n.roles.cache;
    if (oR.size < nR.size) {
        const role = nR.filter(r => !oR.has(r.id)).first();
        enviarLog(new MessageEmbed().setTitle("➕ Rol Añadido").setColor("#2ecc71").setDescription(`A **${n.user.tag}** se le asignó ${role}`).setTimestamp());
    } else if (oR.size > nR.size) {
        const role = oR.filter(r => !nR.has(r.id)).first();
        enviarLog(new MessageEmbed().setTitle("➖ Rol Quitado").setColor("#e74c3c").setDescription(`A **${n.user.tag}** se le quitó ${role}`).setTimestamp());
    }
});

client.on('channelCreate', c => enviarLog(new MessageEmbed().setTitle("🆕 Canal Creado").setColor("#1abc9c").setDescription(`Nombre: ${c.name}`).setTimestamp()));
client.on('channelDelete', c => enviarLog(new MessageEmbed().setTitle("🗑️ Canal Borrado").setColor("#e67e22").setDescription(`Nombre: ${c.name}`).setTimestamp()));

client.on('voiceStateUpdate', (o, n) => {
    let e = new MessageEmbed().setColor("#9b59b6").setTimestamp();
    if (!o.channelId && n.channelId) enviarLog(e.setTitle("🔊 Voz: Conexión").setDescription(`${n.member.user.tag} entró a ${n.channel}`));
    else if (o.channelId && !n.channelId) enviarLog(e.setTitle("🔇 Voz: Desconexión").setDescription(`${o.member.user.tag} salió de ${o.channel.name}`));
});

client.on('ready', () => { 
    console.log(`🔥 ${client.user.username} ONLINE`); 
});

client.login(process.env.TOKEN || config.token);