const { MessageEmbed } = require("discord.js");
const path = require('path');
const config = require('../../DataBaseJson/config.json');

module.exports = {
  name: "proof",
  description: "📑 | Registrar una nueva venta con link de imagen",
  options: [
    { 
        name: "producto", 
        description: "Producto(s) vendidos", 
        type: "STRING", 
        required: true 
    },
    { 
        name: "comprador", 
        description: "Usuario que compró", 
        type: "USER", 
        required: true 
    },
    { 
        name: "monto", 
        description: "Precio (ej: ARS$699.00)", 
        type: "STRING", 
        required: true 
    },
    { 
        name: "metodo", 
        description: "Método de pago", 
        type: "STRING", 
        required: true 
    },
    { 
        name: "evaluacion", 
        description: "Puntuación (1 a 5)", 
        type: "INTEGER", 
        required: true, 
        choices: [
            { name: "⭐", value: 1 }, 
            { name: "⭐⭐", value: 2 }, 
            { name: "⭐⭐⭐", value: 3 }, 
            { name: "⭐⭐⭐⭐", value: 4 }, 
            { name: "⭐⭐⭐⭐⭐", value: 5 }
        ]
    },
    { 
        name: "comentario", 
        description: "Comentario del comprador", 
        type: "STRING", 
        required: true 
    },
    { 
        name: "url_imagen", 
        description: "Pega aquí el LINK de la foto (ej: https://...)", 
        type: "STRING", 
        required: false 
    }
  ],

  run: async (client, interaction) => {
    if (!interaction.member.permissions.has("ADMINISTRATOR")) {
      return interaction.reply({ content: "❌ No tienes permisos.", ephemeral: true });
    }

    const producto = interaction.options.getString("producto");
    const comprador = interaction.options.getUser("comprador");
    const monto = interaction.options.getString("monto");
    const metodo = interaction.options.getString("metodo");
    const estrellas = interaction.options.getInteger("evaluacion");
    const comentario = interaction.options.getString("comentario");
    const linkImagen = interaction.options.getString("url_imagen");

    const canalLog = interaction.guild.channels.cache.get(config.canal_proofs);"1469619944676135033"
    if (!canalLog) return interaction.reply({ content: "❌ Canal no configurado.", ephemeral: true });

    const starBar = "⭐".repeat(estrellas);

    const embedProof = new MessageEmbed()
      .setAuthor({ 
          name: `✅ ${interaction.guild.name} | Compra Aprobada`, 
          iconURL: interaction.guild.iconURL({ dynamic: true }) 
      })
      .setDescription(`**Nueva venta realizada 💳**`)
      .setColor("#2ECC71")
      .addFields(
        { name: "👤 | Comprador", value: `${comprador} (\`${comprador.tag}\`)`, inline: false },
        { name: "🛒 | Producto(s)", value: `\`\`\`\n${producto}\n\`\`\``, inline: false },
        { name: "💸 | Monto", value: `\`${monto}\``, inline: true },
        { name: "💳 | Método", value: `\`${metodo}\``, inline: true },
        { name: "🏷️ | Descuento", value: `\`ARS$0.00\``, inline: true },
        { name: "📅 | Fecha", value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: false },
        { name: "⭐ | Evaluación", value: `${starBar} (${estrellas}/5)\n> **${comprador.username}**: ${comentario}`, inline: false }
      )
      .setFooter({ 
          text: `Venta registrada por ${interaction.user.username}`, 
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }) 
      })
      .setTimestamp();

    // Verificamos si puso un link y lo añadimos al embed
    if (linkImagen) {
        if (linkImagen.startsWith("http")) {
            embedProof.setImage(linkImagen);
        }
    }

    try {
      await canalLog.send({ content: `${comprador}`, embeds: [embedProof] });
      await interaction.reply({ content: `✅ Proof enviada correctamente.`, ephemeral: true });
    } catch (e) {
      console.error(e);
      interaction.reply({ content: "❌ Error enviando la proof.", ephemeral: true });
    }
  }
};