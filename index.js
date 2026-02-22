require('dotenv').config();
const { Client, Collection, MessageEmbed, MessageActionRow, MessageButton, Modal, TextInputComponent } = require('discord.js');
const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const moment = require('moment');
const transcript = require('discord-html-transcripts');
const config = require('./DataBaseJson/config.json');

moment.locale('es');

const client = new Client({
    intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_PRESENCES", "GUILD_MESSAGE_REACTIONS", "GUILD_VOICE_STATES", "DIRECT_MESSAGES"],
    partials: ["MESSAGE", "CHANNEL", "REACTION", "USER", "GUILD_MEMBER"],
});

client.slashCommands = new Collection();

// --- CARGA DE EVENTOS ---
const eventsPath = path.join(__dirname, 'Events');
if (fs.existsSync(eventsPath)) {
    fs.readdirSync(eventsPath).forEach(file => {
        if (file.endsWith('.js')) {
            try { require(`./Events/${file}`)(client); } catch (e) { console.error(e); }
        }
    });
}

const rolPermitidoId = "1469967630365622403"; 

client.on('interactionCreate', async (interaction) => {
    
    if (interaction.isCommand()) {
        const cmd = client.slashCommands.get(interaction.commandName);
        if (!cmd) return;
        try { await cmd.run(client, interaction); } catch (e) { console.error(e); }
        return;
    }

    if (interaction.isButton()) {
        const { customId, guild, user, member } = interaction;

        if (customId === "copiar_cvu" || customId === "copiar_cvu22") return interaction.reply({ content: "0000003100072461415651", ephemeral: true });
        if (customId === "copiar_alias" || customId === "copiar_alias22") return interaction.reply({ content: "710shop", ephemeral: true });

        if (customId === "ticket_compra") {
            const modal = new Modal().setCustomId('modal_compra').setTitle('Formulario de Compra');
            const producto = new TextInputComponent().setCustomId('p_prod').setLabel("¿Qué producto deseas comprar?").setStyle('SHORT').setPlaceholder('Ej: Reseller').setRequired(true);
            const metodo = new TextInputComponent().setCustomId('p_metodo').setLabel("¿Qué método de pago usarás?").setStyle('SHORT').setPlaceholder('Ej: Mercado Pago').setRequired(true);
            const cantidad = new TextInputComponent().setCustomId('p_cant').setLabel("Cantidad").setStyle('SHORT').setPlaceholder('Ej: 1').setRequired(true);
            modal.addComponents(new MessageActionRow().addComponents(producto), new MessageActionRow().addComponents(metodo), new MessageActionRow().addComponents(cantidad));
            return await interaction.showModal(modal);
        }

        if (customId === "ticket_soporte") {
            const modal = new Modal().setCustomId('modal_soporte').setTitle('Formulario de Soporte');
            const problema = new TextInputComponent().setCustomId('s_prob').setLabel("Describe tu problema").setStyle('PARAGRAPH').setPlaceholder('Escribe aquí...').setRequired(true);
            modal.addComponents(new MessageActionRow().addComponents(problema));
            return await interaction.showModal(modal);
        }

        if (customId === "ticket_partner") {
            const modal = new Modal().setCustomId('modal_partner').setTitle('Formulario Partner');
            const link = new TextInputComponent().setCustomId('pa_link').setLabel("Link de tu servidor").setStyle('SHORT').setRequired(true);
            const info = new TextInputComponent().setCustomId('pa_info').setLabel("Información adicional").setStyle('PARAGRAPH').setRequired(false);
            modal.addComponents(new MessageActionRow().addComponents(link), new MessageActionRow().addComponents(info));
            return await interaction.showModal(modal);
        }

        if (customId === "claim_ticket") {
            if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "Solo staff.", ephemeral: true });
            return interaction.reply({ embeds: [new MessageEmbed().setColor("GREEN").setDescription(`✅ El staff ${user} ha reclamado este ticket.`)] });
        }

        if (customId === "notify_user") {
            if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "Solo staff.", ephemeral: true });
            interaction.reply({ content: "🔔 Notificando al usuario...", ephemeral: true });
            return interaction.channel.send({ content: `⚠️ ¡Atención! <@${interaction.channel.topic}> el staff te está llamando.` });
        }

        if (customId === "fechar_ticket") {
            if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "No tienes permiso.", ephemeral: true });
            await interaction.reply("🔒 Cerrando en 4 segundos...");
            try {
                const attachment = await transcript.createTranscript(interaction.channel, { limit: -1, fileName: `ticket-${interaction.channel.name}.html` });
                const logChannel = guild.channels.cache.get("1473454832567320768");
                if (logChannel) await logChannel.send({ content: `📑 Ticket cerrado por **${user.tag}**`, files: [attachment] });
            } catch (e) {}
            setTimeout(() => interaction.channel.delete().catch(() => {}), 4000);
        }
    }

    if (interaction.isModalSubmit()) {
        const { customId, guild, user, fields } = interaction;

        // --- MANEJADOR DE TICKETS ---
        if (customId.startsWith('modal_')) {
            let tipo = customId.replace('modal_', '');
            let categoriaID = "";
            let emoji = "🎫";
            let respuestas = "";

            if (tipo === "compra") {
                categoriaID = "1469945642909438114"; emoji = "🛒";
                respuestas = `🛒 **Producto:**\n> ${fields.getTextInputValue('p_prod')}\n\n💳 **Método:**\n> ${fields.getTextInputValue('p_metodo')}\n\n📄 **Cantidad:**\n> ${fields.getTextInputValue('p_cant')}`;
            } else if (tipo === "soporte") {
                categoriaID = "1469621686155346042"; emoji = "🛠️";
                respuestas = `🛠️ **Problema:**\n> ${fields.getTextInputValue('s_prob')}`;
            } else if (tipo === "partner") {
                categoriaID = "1471010330229477528"; emoji = "🤝";
                respuestas = `🔗 **Link:**\n> ${fields.getTextInputValue('pa_link')}\n\n📝 **Info:**\n> ${fields.getTextInputValue('pa_info') || 'No provista'}`;
            }

            const channelName = `${emoji}-${tipo}-${user.username}`.toLowerCase().substring(0, 31);
            const ticketChannel = await guild.channels.create(channelName, {
                type: 'GUILD_TEXT',
                parent: categoriaID,
                topic: user.id,
                permissionOverwrites: [
                    { id: guild.id, deny: ['VIEW_CHANNEL'] },
                    { id: user.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES'] },
                    { id: rolPermitidoId, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] }
                ],
            });

            await interaction.reply({ content: `✅ Ticket creado: ${ticketChannel}`, ephemeral: true });

            const embedInfo = new MessageEmbed()
                .setTitle("Sistema De Tickets")
                .setDescription("¡Bienvenido/a! Un miembro del staff te atenderá pronto.\nPor favor, espera pacientemente.")
                .setColor("#2f3136")
                .addFields(
                    { name: "👤 Usuario", value: `${user}`, inline: true },
                    { name: "🎟️ Ticket", value: `#${Math.floor(Math.random() * 900) + 100}`, inline: true },
                    { name: "📂 Categoría", value: tipo.toUpperCase(), inline: true }
                )
                .setFooter({ text: `${guild.name} • ${moment().format('HH:mm')}`, iconURL: guild.iconURL({dynamic: true}) });

            const embedRespuestas = new MessageEmbed()
                .setAuthor({ name: "📋 Respuestas del Formulario" })
                .setColor("#000000")
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setDescription(respuestas)
                .setFooter({ text: `Ticket abierto por ${user.username}` });

            const rowBotones = new MessageActionRow().addComponents(
                new MessageButton().setCustomId("fechar_ticket").setLabel("Cerrar").setEmoji("🔒").setStyle("DANGER"),
                new MessageButton().setCustomId("claim_ticket").setLabel("Reclamar").setEmoji("✅").setStyle("SUCCESS"),
                new MessageButton().setCustomId("notify_user").setLabel("Notificar").setEmoji("📩").setStyle("PRIMARY")
            );

            await ticketChannel.send({ content: `${user} | <@&${rolPermitidoId}>`, embeds: [embedInfo, embedRespuestas], components: [rowBotones] });
        }

        // --- MANEJADOR DEL COMANDO /EMBED (CORREGIDO) ---
        if (customId === 'modalanuncio') {
            try {
                const titulo = fields.getTextInputValue("titulo");
                const desc = fields.getTextInputValue("desc");
                const thumbnail = fields.getTextInputValue("thumbnail");
                const banner = fields.getTextInputValue("banner");
                let cor = fields.getTextInputValue("cor");

                if (!/^#([0-9A-Fa-f]{3}){1,2}$/.test(cor)) cor = "#000001";

                const embedanun = new MessageEmbed()
                    .setDescription(desc)
                    .setColor(cor)
                    .setTimestamp()
                    .setFooter({ text: guild.name, iconURL: guild.iconURL({ dynamic: true }) });

                if (titulo) embedanun.setTitle(titulo);
                if (thumbnail && thumbnail.startsWith("http")) embedanun.setThumbnail(thumbnail);
                if (banner && banner.startsWith("http")) embedanun.setImage(banner);

                await interaction.channel.send({ embeds: [embedanun] });
                
                // Respuesta obligatoria para evitar el "No responde"
                return await interaction.reply({ content: `✅ Embed enviado correctamente.`, ephemeral: true });
            } catch (error) {
                console.error(error);
                if (!interaction.replied) return await interaction.reply({ content: `❌ Error al procesar el embed.`, ephemeral: true });
            }
        }
    }
});

client.on('ready', () => { console.log(`🔥 ${client.user.username} online!`); });
client.login(process.env.TOKEN || config.token);