require('dotenv').config();
const { Client, Collection, MessageEmbed, MessageActionRow, MessageButton, Modal, TextInputComponent } = require('discord.js');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const config = require('./DataBaseJson/config.json');

moment.locale('es');

const client = new Client({
    intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS"],
    partials: ["MESSAGE", "CHANNEL", "REACTION", "USER", "GUILD_MEMBER"],
});

client.slashCommands = new Collection();
require('./handler')(client);

// --- CONFIGURACIÓN DE IDs DE CATEGORÍAS ---
const rolPermitidoId = "1469967630365622403"; 

const CATEGORIAS = {
    COMPRA: "1469945642909438114",  // ID Categoría de Compras
    SOPORTE: "1469621686155346042", // Pone el ID real acá
    PARTNER: "1471010330229477528"  // Pone el ID real acá
};

client.on('interactionCreate', async (interaction) => {
    
    if (interaction.isCommand()) {
        const cmd = client.slashCommands.get(interaction.commandName);
        if (cmd) try { await cmd.run(client, interaction); } catch (e) { console.error(e); }
        return;
    }

    // --- MANEJO DE LOS 3 BOTONES ---
    if (interaction.isButton()) {
        const { customId, member } = interaction;

        if (customId === "ticket_compra") {
            const modal = new Modal().setCustomId('modal_compra').setTitle('Formulario de Compra');
            const p = new TextInputComponent().setCustomId('p_prod').setLabel("¿Qué producto deseas?").setStyle('SHORT').setRequired(true);
            const m = new TextInputComponent().setCustomId('p_metodo').setLabel("Método (ARS, USD, Crypto)").setStyle('SHORT').setRequired(true);
            const c = new TextInputComponent().setCustomId('p_cant').setLabel("Cantidad").setStyle('SHORT').setRequired(true).setValue("1");
            modal.addComponents(new MessageActionRow().addComponents(p), new MessageActionRow().addComponents(m), new MessageActionRow().addComponents(c));
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
            const p = new TextInputComponent().setCustomId('p_propuesta').setLabel("Tu propuesta o canal de YT/Twitch").setStyle('PARAGRAPH').setRequired(true);
            modal.addComponents(new MessageActionRow().addComponents(p));
            return await interaction.showModal(modal);
        }

        if (customId === "fechar_ticket") {
            if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "Solo Staff.", ephemeral: true });
            await interaction.reply("🔒 Cerrando en 3 segundos...");
            setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
        }
    }

    // --- MANEJO DE LOS FORMULARIOS (SUBMIT) ---
    if (interaction.isModalSubmit()) {
        // Esto evita el error de "Algo ha fallado" dando tiempo al bot
        await interaction.deferReply({ ephemeral: true });

        let cateId = "";
        let nombreTicket = "";
        let embedColor = "#2f3136";
        let campos = [];

        // Definimos qué datos usar según el formulario
        if (interaction.customId === 'modal_compra') {
            cateId = CATEGORIAS.COMPRA;
            nombreTicket = `🛒-compra-${interaction.user.username}`;
            embedColor = "#00FF00";
            campos = [
                { name: "📦 Producto", value: interaction.fields.getTextInputValue('p_prod'), inline: true },
                { name: "💳 Método", value: interaction.fields.getTextInputValue('p_metodo'), inline: true },
                { name: "🔢 Cantidad", value: interaction.fields.getTextInputValue('p_cant'), inline: true }
            ];
        } else if (interaction.customId === 'modal_soporte') {
            cateId = CATEGORIAS.SOPORTE;
            nombreTicket = `🛠️-soporte-${interaction.user.username}`;
            embedColor = "#FFFF00";
            campos = [{ name: "❓ Problema", value: interaction.fields.getTextInputValue('p_duda') }];
        } else if (interaction.customId === 'modal_partner') {
            cateId = CATEGORIAS.PARTNER;
            nombreTicket = `🤝-partner-${interaction.user.username}`;
            embedColor = "#00AAFF";
            campos = [{ name: "📝 Propuesta", value: interaction.fields.getTextInputValue('p_propuesta') }];
        }

        try {
            const canal = await interaction.guild.channels.create(nombreTicket, {
                type: 'GUILD_TEXT',
                parent: cateId,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: ['VIEW_CHANNEL'] },
                    { id: interaction.user.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES'] },
                    { id: rolPermitidoId, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] }
                ]
            });

            const embed = new MessageEmbed()
                .setTitle("NUEVO TICKET ABIERTO")
                .setColor(embedColor)
                .addFields(campos)
                .setFooter({ text: `Usuario: ${interaction.user.tag}` })
                .setTimestamp();

            const row = new MessageActionRow().addComponents(
                new MessageButton().setCustomId("fechar_ticket").setLabel("Cerrar Ticket").setStyle("DANGER").setEmoji("🔒")
            );

            await canal.send({ content: `<@&${rolPermitidoId}> | ${interaction.user}`, embeds: [embed], components: [row] });
            await interaction.editReply({ content: `✅ Ticket creado: ${canal}` });

        } catch (e) {
            console.error(e);
            await interaction.editReply({ content: "❌ Error: Revisa si los IDs de las categorías están bien puestos." });
        }
    }
});

client.login(process.env.TOKEN || config.token);