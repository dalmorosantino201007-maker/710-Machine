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

// --- FUNCIÓN PARA ENVIAR LOGS ---
const enviarLog = (embed) => {
    const canal = client.channels.cache.get(canalLogsId);
    if (canal) canal.send({ embeds: [embed] }).catch(() => {});
};

// --- LÓGICA DE INTERACCIONES ---
client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand()) {
        const cmd = client.slashCommands.get(interaction.commandName);
        if (cmd) try { await cmd.run(client, interaction); } catch (e) { console.error(e); }
        return;
    }
    // (Aquí iría tu lógica de botones y modales de tickets que ya tienes)
});

// ==========================================
// 🔥 SISTEMA DE LOGS ULTRA DETALLADO 🔥
// ==========================================

// --- 📧 LOG DE MENSAJES ENVIADOS (NUEVO) ---
client.on('messageCreate', m => {
    if (!m.guild || m.author.bot || m.channel.id === canalLogsId) return; // No loguear bots ni el propio canal de logs
    
    const embed = new MessageEmbed()
        .setAuthor({ name: `Mensaje Enviado: ${m.author.tag}`, iconURL: m.author.displayAvatarURL() })
        .setColor("#2f3136")
        .setDescription(`**Canal:** ${m.channel}\n**Contenido:**\n${m.content || "*[Archivo o Embed]*"}`)
        .setFooter({ text: `ID Usuario: ${m.author.id}` })
        .setTimestamp();

    enviarLog(embed);
});

// --- 🛡️ LOGS DE MENSAJES (BORRADOS/EDITADOS) ---
client.on('messageDelete', m => {
    if (!m.guild || m.author?.bot) return;
    enviarLog(new MessageEmbed().setTitle("🗑️ Mensaje Borrado").setColor("#ff0000").addFields(
        { name: "Autor", value: `${m.author.tag}`, inline: true },
        { name: "Canal", value: `${m.channel}`, inline: true },
        { name: "Contenido", value: `\`\`\`${m.content || "Imagen/Archivo"}\`\`\`` }
    ).setTimestamp());
});

client.on('messageUpdate', (o, n) => {
    if (o.author?.bot || o.content === n.content) return;
    enviarLog(new MessageEmbed().setTitle("✏️ Mensaje Editado").setColor("#ffff00").addFields(
        { name: "Autor", value: `${o.author.tag}`, inline: true },
        { name: "Canal", value: `${o.channel}`, inline: true },
        { name: "Antes", value: `\`\`\`${o.content}\`\`\`` },
        { name: "Después", value: `\`\`\`${n.content}\`\`\`` }
    ).setTimestamp());
});

// --- 👥 LOGS DE MIEMBROS Y ROLES ---
client.on('guildMemberAdd', m => {
    enviarLog(new MessageEmbed().setTitle("📥 Miembro Nuevo").setColor("#00ff00").setDescription(`**${m.user.tag}** entró al servidor.`).setThumbnail(m.user.displayAvatarURL()).setTimestamp());
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

// --- 🏷️ LOGS DE ROLES (CREACIÓN/BORRADO) ---
client.on('roleCreate', r => enviarLog(new MessageEmbed().setTitle("🆕 Rol Creado").setColor("#3498db").setDescription(`Nombre: **${r.name}**\nID: \`${r.id}\``).setTimestamp()));
client.on('roleDelete', r => enviarLog(new MessageEmbed().setTitle("🗑️ Rol Eliminado").setColor("#c0392b").setDescription(`Nombre: **${r.name}**`).setTimestamp()));

// --- 📺 LOGS DE CANALES ---
client.on('channelCreate', c => enviarLog(new MessageEmbed().setTitle("🆕 Canal Creado").setColor("#1abc9c").setDescription(`Canal: ${c}\nTipo: ${c.type}`).setTimestamp()));
client.on('channelDelete', c => enviarLog(new MessageEmbed().setTitle("🗑️ Canal Borrado").setColor("#e67e22").setDescription(`Nombre: **${c.name}**`).setTimestamp()));

// --- 🔊 LOGS DE VOZ ---
client.on('voiceStateUpdate', (o, n) => {
    let e = new MessageEmbed().setColor("#9b59b6").setTimestamp();
    if (!o.channelId && n.channelId) enviarLog(e.setTitle("🔊 Voz: Conexión").setDescription(`${n.member.user.tag} entró a ${n.channel}`));
    else if (o.channelId && !n.channelId) enviarLog(e.setTitle("🔇 Voz: Desconexión").setDescription(`${o.member.user.tag} salió de ${o.channel.name}`));
    else if (o.channelId !== n.channelId) enviarLog(e.setTitle("🔀 Voz: Cambio").setDescription(`${n.member.user.tag} se movió a ${n.channel}`));
});

// --- 🔨 LOGS DE MODERACIÓN (BANEOS) ---
client.on('guildBanAdd', b => enviarLog(new MessageEmbed().setTitle("🔨 Usuario Baneado").setColor("#000000").setDescription(`**${b.user.tag}** fue baneado.`).setTimestamp()));
client.on('guildBanRemove', b => enviarLog(new MessageEmbed().setTitle("🔓 Usuario Desbaneado").setColor("#ffffff").setDescription(`**${b.user.tag}** fue desbaneado.`).setTimestamp()));

// --- 🚀 ENCENDIDO ---
client.on('ready', () => { 
    console.log(`🔥 ${client.user.username} - VIGILANCIA TOTAL ACTIVADA`); 
});

client.login(process.env.TOKEN || config.token);