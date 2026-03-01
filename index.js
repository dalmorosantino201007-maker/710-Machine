require('dotenv').config(); 

const { 
    Client, 
    Collection, 
    MessageEmbed, 
    MessageActionRow, 
    MessageButton, 
    Modal, 
    TextInputComponent 
} = require('discord.js');

const fs = require('fs');
const path = require('path');
const moment = require('moment');
const transcripts = require('discord-html-transcripts'); 
const config = require('./DataBaseJson/config.json');

moment.locale('es');

const client = new Client({
    intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "GUILD_VOICE_STATES", "GUILD_PRESENCES", "GUILD_BANS", "DIRECT_MESSAGES"],
    partials: ["MESSAGE", "CHANNEL", "REACTION", "USER", "GUILD_MEMBER"],
});

// --- 📂 MANEJO DE COMANDOS (HANDLER) ---
client.slashCommands = new Collection();
try {
    require('./handler')(client);
    console.log("✅ Handler cargado correctamente.");
} catch (error) {
    console.error("❌ Error cargando el Handler:", error);
}

// --- 🛠️ CONFIGURACIÓN DE IDs ---
const rolPermitidoId = "1469967630365622403"; 
const canalTranscriptsId = "1473454832567320768"; 
const canalLogsId = "1470928427199631412"; 
const canalWelcomeId = "1469618755037429792"; 
const rolPartnerAutoId = "1470862847671140412"; 
const ID_SERVIDOR = '1469618754282586154';
const CATEGORIAS = {
    COMPRA: "1469945642909438114",  
    SOPORTE: "1469621686155346042", 
    PARTNER: "1471010330229477528"  
};

// --- 💾 FUNCIONES DE BASE DE DATOS ---
const rankingPath = './DataBaseJson/ranking.json';
const contadorPath = './DataBaseJson/contador.json';

function updateRanking(userId, userTag) {
    if (!fs.existsSync(rankingPath)) fs.writeFileSync(rankingPath, JSON.stringify({}));
    let ranking = JSON.parse(fs.readFileSync(rankingPath, 'utf8'));
    if (!ranking[userId]) ranking[userId] = { tag: userTag, tickets: 0 };
    ranking[userId].tickets += 1;
    fs.writeFileSync(rankingPath, JSON.stringify(ranking, null, 2));
}

const enviarLog = (embed) => {
    const canal = client.channels.cache.get(canalLogsId);
    if (canal) canal.send({ embeds: [embed] }).catch((e) => console.error("Error enviando log:", e));
};

// ==========================================
// 👋 EVENTOS DE MIEMBROS (WELCOME & LEAVE)
// ==========================================
client.on('guildMemberAdd', async (member) => {
    const canal = client.channels.cache.get(canalWelcomeId);
    if (canal) {
        const embedWelcome = new MessageEmbed()
            .setTitle("👋 ¡Bienvenido a 710 Bot Shop!")
            .setDescription(`Hola ${member}, gracias por unirte a **${member.guild.name}**.\n\n> No olvides leer las normas y abrir un ticket si deseas comprar algo.`)
            .setColor("#2f3136")
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setImage("https://i.imgur.com/Tu7vI7h.png")
            .setFooter({ text: `Eres el miembro número ${member.guild.memberCount}` })
            .setTimestamp();
        canal.send({ content: `Bienvenido/a ${member}! 🚀`, embeds: [embedWelcome] });
    }
    enviarLog(new MessageEmbed().setTitle("📥 Miembro Unido").setDescription(`El usuario ${member.user.tag} ha entrado al servidor.`).setColor("GREEN").setTimestamp());
});

client.on('guildMemberRemove', (member) => {
    enviarLog(new MessageEmbed().setTitle("📤 Miembro Salido").setDescription(`El usuario ${member.user.tag} ha abandonado el servidor.`).setColor("RED").setTimestamp());
});

// ==========================================
// 🕹️ EVENTO: INTERACTION CREATE (CORREGIDO)
// ==========================================
client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isCommand()) {
            const command = client.slashCommands.get(interaction.commandName);
            if (command) return await command.run(client, interaction);

            if (interaction.commandName === "renvembed") {
                if (!interaction.member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ No tienes permiso.", ephemeral: true });
                const embedPanel = new MessageEmbed()
                    .setTitle("📩 CENTRO DE ATENCIÓN Y PARTNERS")
                    .setDescription("Selecciona una categoría para abrir un ticket o verificar tu partner.\n\n🛒 **Compras:** Para adquirir productos.\n🛠 **Soporte:** Dudas generales.\n🤝 **Partner:** Si cumples los requisitos.\n✅ **Verificar Partner:** Si ya tienes el canal del AD puesto.")
                    .setColor("#2f3136");
                const row = new MessageActionRow().addComponents(
                    new MessageButton().setCustomId("ticket_compra").setLabel("Compras").setStyle("PRIMARY").setEmoji("🛒"),
                    new MessageButton().setCustomId("ticket_soporte").setLabel("Soporte").setStyle("SECONDARY").setEmoji("🛠"),
                    new MessageButton().setCustomId("ticket_partner").setLabel("Solicitar Partner").setStyle("SUCCESS").setEmoji("🤝"),
                    new MessageButton().setCustomId("verificar_partner").setLabel("Auto-Partner").setStyle("DANGER").setEmoji("✅")
                );
                await interaction.channel.send({ embeds: [embedPanel], components: [row] });
                return interaction.reply({ content: "✅ Panel enviado correctamente.", ephemeral: true });
            }

            if (interaction.commandName === "embed") {
                return interaction.reply({ embeds: [new MessageEmbed().setTitle("710 Bot Shop").setDescription("Comando de embed funcionando.").setColor("#2f3136")] });
            }

            if (["reseller", "customer", "ultra"].includes(interaction.commandName)) {
                if (!interaction.member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ No tienes permiso.", ephemeral: true });
                const targetUser = interaction.options.getMember('usuario');
                let rolId = interaction.commandName === "reseller" ? "1473471902810112062" : (interaction.commandName === "customer" ? "1470894748041482416" : "1470865175866507394");
                let prefijo = interaction.commandName.charAt(0).toUpperCase() + interaction.commandName.slice(1);
                try {
                    await targetUser.roles.add(rolId);
                    await targetUser.setNickname(`${prefijo} | ${targetUser.user.username}`).catch(() => {});
                    return interaction.reply({ embeds: [new MessageEmbed().setTitle(`🎉 Rango ${prefijo} Asignado`).setColor("GREEN").setDescription(`¡Hola ${targetUser}! Ya tienes tu rango.`).setTimestamp()] });
                } catch (e) { return interaction.reply({ content: "❌ Error de jerarquía.", ephemeral: true }); }
            }
        }

        if (interaction.isButton()) {
            const { customId, member, user } = interaction;
            if (customId === "verificar_partner") {
                if (member.roles.cache.has(rolPartnerAutoId)) return interaction.reply({ content: "✅ Ya eres Partner.", ephemeral: true });
                await member.roles.add(rolPartnerAutoId);
                enviarLog(new MessageEmbed().setTitle("🤝 Auto-Partner").setDescription(`${user.tag} se verificó solo.`).setColor("BLUE").setTimestamp());
                return interaction.reply({ content: "🎉 Rol asignado correctamente!", ephemeral: true });
            }
            // Lógica de "Asumir", "Fechar" y abrir Tickets (mantenida igual pero funcional)
            if (customId === "asumir") {
                if (!member.roles.cache.has(rolPermitidoId)) return interaction.reply({ content: "❌ No eres Staff.", ephemeral: true });
                updateRanking(user.id, user.tag);
                return await interaction.reply({ content: `✅ El Staff ${user} ha asumido este ticket.` });
            }
            if (customId === "fechar_ticket") {
                const modalCierre = new Modal().setCustomId('modal_nota_cierre').setTitle('Cerrar Ticket');
                modalCierre.addComponents(new MessageActionRow().addComponents(new TextInputComponent().setCustomId('nota_staff').setLabel("Nota final").setStyle('PARAGRAPH')));
                return await interaction.showModal(modalCierre);
            }
            if (customId.startsWith("ticket_")) {
                const tipo = customId.split('_')[1];
                const modal = new Modal().setCustomId(`modal_${tipo}`).setTitle(`Ticket de ${tipo.toUpperCase()}`);
                modal.addComponents(new MessageActionRow().addComponents(new TextInputComponent().setCustomId('p_input').setLabel("Escribe tu duda o producto").setStyle('PARAGRAPH').setRequired(true)));
                return await interaction.showModal(modal);
            }
        }

        if (interaction.isModalSubmit()) {
            const { customId, user, guild, channel } = interaction;
            if (customId.startsWith('modal_') && customId !== 'modal_nota_cierre') {
                await interaction.deferReply({ ephemeral: true });
                const tipo = customId.split('_')[1];
                const nombreLimpio = user.username.replace(/[^a-zA-Z0-9]/g, "") || user.id;
                const nChannel = await guild.channels.create(`${tipo}-${nombreLimpio}`, {
                    parent: CATEGORIAS[tipo.toUpperCase()],
                    permissionOverwrites: [
                        { id: guild.id, deny: ['VIEW_CHANNEL'] },
                        { id: user.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] },
                        { id: rolPermitidoId, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] }
                    ]
                });
                const row = new MessageActionRow().addComponents(
                    new MessageButton().setCustomId("fechar_ticket").setLabel("Cerrar").setStyle("DANGER"),
                    new MessageButton().setCustomId("asumir").setLabel("Asumir").setStyle("SUCCESS")
                );
                await nChannel.send({ content: `${user} | <@&${rolPermitidoId}>`, components: [row] });
                return interaction.editReply(`✅ Ticket creado: ${nChannel}`);
            }
            if (customId === 'modal_nota_cierre') {
                await interaction.deferReply();
                const transcript = await transcripts.createTranscript(channel);
                await client.channels.cache.get(canalTranscriptsId).send({ files: [transcript] });
                await interaction.editReply("🔒 Cerrando...");
                setTimeout(() => channel.delete().catch(() => {}), 3000);
            }
        }
    } catch (err) { console.error(err); }
});

// ==========================================
// 📡 AUDITORÍA COMPLETA (LOGS)
// ==========================================

// Mensajes
client.on('messageDelete', m => {
    if (!m.guild || m.author?.bot) return;
    enviarLog(new MessageEmbed().setTitle("🗑️ Mensaje Borrado").setColor("RED").addFields({ name: "Autor", value: `${m.author.tag}`, inline: true }, { name: "Canal", value: `${m.channel}`, inline: true }, { name: "Contenido", value: m.content || "Sin texto" }).setTimestamp());
});
client.on('messageUpdate', (o, n) => {
    if (!o.guild || o.author?.bot || o.content === n.content) return;
    enviarLog(new MessageEmbed().setTitle("✏️ Mensaje Editado").setColor("YELLOW").addFields({ name: "Autor", value: `${o.author.tag}` }, { name: "Antes", value: o.content || "Vacío" }, { name: "Después", value: n.content || "Vacío" }).setTimestamp());
});

// Canales
client.on('channelCreate', c => enviarLog(new MessageEmbed().setTitle("🆕 Canal Creado").setDescription(`Nombre: **${c.name}**\nTipo: ${c.type}`).setColor("GREEN").setTimestamp()));
client.on('channelDelete', c => enviarLog(new MessageEmbed().setTitle("🚫 Canal Eliminado").setDescription(`Nombre: **${c.name}**`).setColor("RED").setTimestamp()));
client.on('channelUpdate', (o, n) => { if (o.name !== n.name) enviarLog(new MessageEmbed().setTitle("⚙️ Canal Editado").setDescription(`Antes: ${o.name}\nDespués: ${n.name}`).setColor("ORANGE").setTimestamp()); });

// Roles
client.on('roleCreate', r => enviarLog(new MessageEmbed().setTitle("🎭 Rol Creado").setDescription(`Nombre: ${r.name}`).setColor("GREEN").setTimestamp()));
client.on('roleDelete', r => enviarLog(new MessageEmbed().setTitle("🔥 Rol Eliminado").setDescription(`Nombre: ${r.name}`).setColor("RED").setTimestamp()));
client.on('guildMemberUpdate', (o, n) => {
    const addedRoles = n.roles.cache.filter(r => !o.roles.cache.has(r.id));
    const removedRoles = o.roles.cache.filter(r => !n.roles.cache.has(r.id));
    addedRoles.forEach(r => enviarLog(new MessageEmbed().setTitle("✅ Rol Añadido").setDescription(`A: ${n.user.tag}\nRol: ${r.name}`).setColor("BLUE").setTimestamp()));
    removedRoles.forEach(r => enviarLog(new MessageEmbed().setTitle("❌ Rol Quitado").setDescription(`A: ${n.user.tag}\nRol: ${r.name}`).setColor("DARK_RED").setTimestamp()));
});

// Voz
client.on('voiceStateUpdate', (o, n) => {
    if (!o.channelId && n.channelId) enviarLog(new MessageEmbed().setTitle("🔊 Entró a Voz").setDescription(`${n.member.user.tag} entró a ${n.channel.name}`).setColor("AQUA").setTimestamp());
    if (o.channelId && !n.channelId) enviarLog(new MessageEmbed().setTitle("🔇 Salió de Voz").setDescription(`${o.member.user.tag} salió de ${o.channel.name}`).setColor("GREY").setTimestamp());
});

// ==========================================
// 🚀 INICIO
// ==========================================
client.on('ready', async () => {
    console.log(`🔥 ${client.user.username} - OPERATIVO`);
    const guild = client.guilds.cache.get(ID_SERVIDOR);
    if (guild) {
        await guild.commands.set([
            { name: 'reseller', description: 'Rango Reseller', options: [{ name: 'usuario', type: 'USER', required: true, description: 'User' }] },
            { name: 'customer', description: 'Rango Customer', options: [{ name: 'usuario', type: 'USER', required: true, description: 'User' }] },
            { name: 'ultra', description: 'Rango Ultra', options: [{ name: 'usuario', type: 'USER', required: true, description: 'User' }] },
            { name: 'renvembed', description: 'Enviar panel de tickets' },
            { name: 'embed', description: 'Test embed' },
            { name: 'mp', description: 'Métodos de pago' }
        ]);
    }
});

client.login(process.env.TOKEN || config.token);