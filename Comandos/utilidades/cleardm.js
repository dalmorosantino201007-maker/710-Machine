const Discord = require("discord.js");

module.exports = {
  name: "cleardm",
  description: "🔨 | ¡Borra todos los mensajes del bot en tu DM!",

  run: async (client, interaction) => {
    // Respuesta inicial
    await interaction.reply({ 
        content: `<:checkwhite:1374234754366570576> | ${interaction.user} ¡Voy a intentar limpiar nuestro DM! (Límite: últimos 100 mensajes)`, 
        ephemeral: true 
    });

    let quantidadeApagada = 0;

    try {
      // Creamos/obtenemos el canal de DM con el usuario
      const dmChannel = await interaction.user.createDM();
      
      // Buscamos los últimos 100 mensajes en ese canal
      const messages = await dmChannel.messages.fetch({ limit: 100 });

      // Filtramos solo los mensajes que envió el BOT
      const botMessages = messages.filter(m => m.author.id === client.user.id);

      for (const msg of botMessages.values()) {
        if (msg.deletable) {
          await msg.delete().catch(() => {}); // Ignorar errores si no se puede borrar
          quantidadeApagada++;
          
          // Pequeña pausa para evitar Rate Limit de Discord
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (quantidadeApagada === 0) {
        return await interaction.editReply({ 
            content: `<:crosshost2:1384349772386664550> | No encontré mensajes míos para borrar en tus mensajes directos.` 
        });
      }

      await interaction.editReply({ 
          content: `<:checkwhite:1374234754366570576> | ¡Limpieza completada! He eliminado **${quantidadeApagada}** mensajes.` 
      });

    } catch (error) {
      console.error(error);
      await interaction.editReply({ 
          content: `❌ Hubo un error al intentar acceder a tus mensajes directos. ¿Tienes los DM cerrados?` 
      });
    }
  }
};