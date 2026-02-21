const { MessageEmbed } = require("discord.js");
const path = require('path');
const config = require(path.join(process.cwd(), 'DataBaseJson', 'config.json'));

module.exports = {
  name: "proof",
  description: "📑 | Registrar una nueva venta estilo Saytus con línea lateral",
  options: [
    { name: "producto", description: "Producto(s) vendidos", type: "STRING", required: true },
    { name: "comprador", description: "Usuario que compró", type: "USER", required: true },
    { name: "monto", description: "Precio (ej: ARS$350.00)", type: "STRING", required: true },
    { name: "metodo", description: "Método de pago", type: "STRING", required: true },
    { 
        name: "evaluacion", 
        description: "Puntuación de la venta", 
        type: "INTEGER", 
        required: true, 
        choices: [
            { name: "Sin evaluación", value: 0 },
            { name: "⭐", value: 1 }, { name: "⭐⭐", value: 2 }, { name: "⭐⭐⭐", value: 3 }, 
            { name: "⭐⭐⭐⭐", value: 4 }, { name: "⭐⭐⭐⭐⭐", value: 5 }
        ] 
    },
    { name: "url_imagen", description: "Link de la imagen del producto", type: "STRING", required: true },
    { name: "comentario", description: "Comentario (opcional)", type: "STRING", required: false }
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

    const canalId = config.canal_proofs || "1469619944676135033";
    const canalLog = interaction.guild.channels.cache.get(canalId);

    if (!canalLog) return interaction.reply({ content: "❌ Canal no encontrado.", ephemeral: true });

    const fechaUnix = Math.floor(Date.now() / 1000);
    
    // Configuración de la Evaluación (Estilo Saytus)
    let evaluacionTexto = "";
    if (estrellas === 0) {
        evaluacionTexto = "\`Sin evaluación\`";
    } else {
        evaluacionTexto = "⭐".repeat(estrellas) + ` (${estrellas}/5)`;
        if (comentario) {
            evaluacionTexto += `\n> ${comentario}`;
        }
    }

    const embedProof = new MessageEmbed()
      .setAuthor({ 
          name: `${interaction.guild.name} | Compra Aprobada`, 
          iconURL: interaction.guild.iconURL({ dynamic: true }) 
      })
      .setDescription(`**Nueva venta realizada 💳**`)
      .setColor("#2ECC71") // El color verde brillante de la barra lateral
      .addFields(
        { 
            name: "👤 | Comprador", 
            value: `${comprador} (\`${comprador.username}\`)`, 
            inline: false 
        },
        { 
            name: "🛒 | Producto(s)", 
            // Aquí está el truco: usamos ">" para la línea lateral y quitamos los ```
            value: `> ${producto}`, 
            inline: false 
        },
        { name: "💸 | Monto", value: `\`${monto}\``, inline: true },
        { name: "💳 | Método", value: `\`${metodo}\``, inline: true },
        { name: "🎟️ | Descuento", value: `\`ARS$0.00\``, inline: true },
        { 
            name: "📅 | Fecha", 
            value: `<t:${fechaUnix}:f> (<t:${fechaUnix}:R>)`, 
            inline: false 
        },
        { 
            name: "⭐ | Evaluación", 
            value: evaluacionTexto, 
            inline: false 
        }
      )
      .setImage(linkImagen)
      .setFooter({ 
          text: `${interaction.guild.name} - Sistema de Ventas Automático`, 
          iconURL: interaction.guild.iconURL({ dynamic: true }) 
      })
      .setTimestamp();

    try {
      await canalLog.send({ content: `${comprador}`, embeds: [embedProof] });
      await interaction.reply({ content: `✅ Proof enviada correctamente.`, ephemeral: true });
    } catch (e) {
      console.error(e);
      interaction.reply({ content: "❌ Error enviando la proof.", ephemeral: true });
    }
  }
};