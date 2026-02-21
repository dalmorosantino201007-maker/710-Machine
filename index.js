require('dotenv').config();
const { Client, Collection, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const moment = require('moment');
const transcript = require('discord-html-transcripts');
const config = require('./DataBaseJson/config.json');

moment.locale('es');

// --- INICIALIZACIÓN DEL CLIENTE ---
const client = new Client({
    intents: [
        "GUILDS",
        "GUILD_MEMBERS",
        "GUILD_MESSAGES",
        "GUILD_PRESENCES",
        "GUILD_MESSAGE_REACTIONS",
        "GUILD_VOICE_STATES",
        "DIRECT_MESSAGES"
    ],
    partials: ["MESSAGE", "CHANNEL", "REACTION", "USER", "GUILD_MEMBER"],
});

client.slashCommands = new Collection();

// --- CARGA DE EVENTOS EXTERNOS ---
const eventsPath = path.join(__dirname, 'Events');
if (fs.existsSync(eventsPath)) {
    fs.readdirSync(eventsPath).forEach(file => {
        if (file.endsWith('.js')) {
            try {
                require(`./Events/${file}`)(client);
                console.log(`✅ Evento cargado: ${file}`);
            } catch (error) {
                console.error(`❌ Error cargando evento ${file}:`, error);
            }
        }
    });
}

// --- BASE DE DATOS ---
const dbPath = path.join(__dirname, 'tickets.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error al abrir la base de datos:', err.message);
    } else {
        console.log('✅ Base de datos SQLite conectada.');
        db.run(`CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            creatorId TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

const rolPermitidoId = "1469967630365622403"; // ID del STAFF

// --- MANEJADOR DE INTERACCIONES ---
client.on('interactionCreate', async (interaction) => {
    
    // --- MANEJADOR DE SLASH COMMANDS ---
    if (interaction.isCommand()) {
        const cmd = client.slashCommands.get(interaction.commandName);
        if (!cmd) return;
        try { await cmd.run(client, interaction); } catch (e) { console.error(e); }
        return;
    }

    // --- MANEJADOR DE BOTONES ---
    if (interaction.isButton()) {
        const { customId, guild, user, member } = interaction;

        if (customId === "copiar_cvu" || customId === "copiar_cvu22") return interaction.reply({ content: "0000003100072461415651", ephemeral: true });
        if (customId === "copiar_alias" || customId === "copiar_alias22") return interaction.reply({ content: "710shop", ephemeral: true });

        if (customId === "partner_rol") {
            const rolId = "1470862847671140412";
            if (member.roles.cache.has(rolId)) {
                await member.roles.remove(rolId);
                return interaction.reply({ content: `❌ | Rol removido.`, ephemeral: true });
            } else {
                await member.roles.add(rolId);
                return interaction.reply({ content: `✅ | Rol asignado.`, ephemeral: true });
            }
        }

        // --- SISTEMA DE TICKETS ---
        if (["opc1", "opc2", "opc3", "ticket_compra", "ticket_soporte", "ticket_partner"].includes(customId)) {
            let tipo = "";
            let categoriaID = "";
            let emoji = "🎫"; 
            let colorEmbed = "#000001";

            const catCompras = "1469945642909438114";
            const catSoporte = "1469621686155346042";
            const catPartner = "1471010330229477528";

            if (customId === "opc1" || customId === "ticket_compra") { 
                tipo = "compra"; categoriaID = catCompras; emoji = "🛒"; colorEmbed = "#2ECC71";
            }
            else if (customId === "opc2" || customId === "ticket_soporte") { 
                tipo = "soporte"; categoriaID = catSoporte; emoji = "🛠️"; colorEmbed = "#3498DB";
            }
            else if (customId === "opc3" || customId === "ticket_partner") { 
                tipo = "partner"; categoriaID = catPartner; emoji = "🤝"; colorEmbed = "#9B59B6";
            }

            const channelName = `${emoji}-${tipo}-${user.username}`.toLowerCase().substring(0, 31);
            const yaTiene = guild.channels.cache.find(c => c.name === channelName);
            if (yaTiene) return interaction.reply({ content: `❌ Ya tienes un ticket abierto: ${yaTiene}`, ephemeral: true });

            try {
                const ticketChannel = await guild.channels.create(channelName, {
                    type: 'GUILD_TEXT',
                    parent: categoriaID,
                    permissionOverwrites: [
                        { id: guild.id, deny: ['VIEW_CHANNEL'] },
                        { id: user.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES'] },
                        { id: rolPermitidoId, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] }
                    ],
                });

                await interaction.reply({ content: `✅ Ticket de **${tipo}** creado: ${ticketChannel}`, ephemeral: true });

                const welcomeEmbed = new MessageEmbed()
                    .setTitle(`${emoji} Ticket de ${tipo.toUpperCase()}`)
                    .setColor(colorEmbed)
                    .setDescription(`Hola ${user}, gracias por contactar con **${guild.name}**.\n\nPor favor, explica tu consulta detalladamente. El <@&${rolPermitidoId}> te atenderá pronto.`)
                    .setTimestamp();

                const rowClose = new MessageActionRow().addComponents(
                    new MessageButton().setCustomId("fechar_ticket").setLabel("Cerrar").setEmoji("🔒").setStyle("DANGER"),
                    new MessageButton().setCustomId("claim_ticket").setLabel("Reclamar").setEmoji("🙋‍♂️").setStyle("SUCCESS"),
                    new MessageButton().setCustomId("notify_user").setLabel("Notificar").setEmoji("🔔").setStyle("PRIMARY")
                );

                await ticketChannel.send({ 
                    content: `${user} | <@&${rolPermitidoId}>`, 
                    embeds: [welcomeEmbed], 
                    components: [rowClose] 
                });
            } catch (err) {
                console.error(err);
                interaction.reply({ content: "❌ Error al crear ticket.", ephemeral: true });
            }
            return;
        }

        if (customId === "claim_ticket") {
            if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "Solo el staff puede reclamar.", ephemeral: true });
            return interaction.reply({ content: `✅ El staff **${user.tag}** ha reclamado este ticket.` });
        }

        if (customId === "notify_user") {
            if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "Solo el staff puede notificar.", ephemeral: true });
            const partes = interaction.channel.name.split('-');
            const nombreEnCanal = partes[partes.length - 1].toLowerCase();
            const objetivo = guild.members.cache.find(m => m.user.username.toLowerCase() === nombreEnCanal);

            if (!objetivo) return interaction.reply({ content: "❌ No pude encontrar al dueño del ticket.", ephemeral: true });

            try {
                const embedNotify = new MessageEmbed()
                    .setColor("#5865F2")
                    .setTitle("🔔 ¡Atención en tu Ticket!")
                    .setDescription(`Hola ${objetivo}, el Staff **${user.tag}** te está llamando en tu ticket: ${interaction.channel}`)
                    .setFooter(`Servidor: ${guild.name}`)
                    .setTimestamp();

                await objetivo.send({ embeds: [embedNotify] });
                return interaction.reply({ content: `✅ Notificación enviada a **${objetivo.user.tag}**.` });
            } catch (err) {
                return interaction.reply({ content: "❌ No pude enviar el mensaje (DMs cerrados).", ephemeral: true });
            }
        }

        if (customId === "fechar_ticket") {
            if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "No tienes permiso para cerrar.", ephemeral: true });
            await interaction.reply("🔒 Cerrando ticket...");
            try {
                const attachment = await transcript.createTranscript(interaction.channel, {
                    limit: -1,
                    fileName: `ticket-${interaction.channel.name}.html`
                });
                const logChannel = guild.channels.cache.get("1473454832567320768");
                if (logChannel) {
                    await logChannel.send({ 
                        content: `📑 Ticket **${interaction.channel.name}** cerrado por **${user.tag}**`, 
                        files: [attachment] 
                    });
                }
            } catch (err) { console.error(err); }
            setTimeout(() => interaction.channel.delete().catch(() => {}), 4000);
        }
    }

    // --- MANEJADOR DE MODALES (PARA EL COMANDO EMBED) ---
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'modalanuncio') {
            const titulo = interaction.fields.getTextInputValue("titulo");
            const desc = interaction.fields.getTextInputValue("desc");
            const thumbnail = interaction.fields.getTextInputValue("thumbnail");
            const banner = interaction.fields.getTextInputValue("banner");
            let cor = interaction.fields.getTextInputValue("cor");

            // Validación de color
            if (!/^#([0-9A-Fa-f]{3}){1,2}$/.test(cor)) cor = config.colorpredeterminado || "#000000";

            const embedanun = new MessageEmbed()
                .setDescription(desc)
                .setColor(cor)
                .setTimestamp()
                .setFooter({
                    text: `${interaction.guild.name}`,
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                });

            if (titulo) embedanun.setTitle(titulo);
            if (banner && banner.startsWith("http")) embedanun.setImage(banner);
            if (thumbnail && thumbnail.startsWith("http")) embedanun.setThumbnail(thumbnail);

            const buttonRow = new MessageActionRow().addComponents(
                new MessageButton()
                    .setLabel("Compra Aqui / Buy Here")
                    .setStyle("LINK")
                    .setURL("https://discord.com/channels/1469618754282586154/1469950823474659409")
            );

            try {
                await interaction.channel.send({ embeds: [embedanun], components: [buttonRow] });
                await interaction.reply({ content: `✅ ¡Embed enviado correctamente!`, ephemeral: true });
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: `❌ Error al enviar el embed. Verifica los enlaces.`, ephemeral: true });
            }
        }
    }
});

// --- EVENTOS READY Y LOGIN ---
client.on('ready', () => {
    console.log(`🔥 ${client.user.username} online con comandos, botones y modales!`);
});

const handlerPath = path.join(__dirname, 'handler', 'index.js');
if (fs.existsSync(handlerPath)) { require('./handler/index.js')(client); }

client.login(process.env.TOKEN || config.token).catch(err => console.error("❌ Token inválido."));

process.on('unhandledRejection', error => console.error('Unhandled Rejection:', error));
process.on('uncaughtException', error => console.error('Uncaught Exception:', error));