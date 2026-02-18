module.exports = {
  name: "cleardm",
  description: "🔨 | ¡Borra todos los mensajes del bot en tu DM!",
  run: async(client, interaction) => {
    await interaction.reply(`<:checkwhite:1374234754366570576> | ${interaction.user} ¡Voy a limpiar nuestro DM!`)
    let quantidadeApagada = 0;
    const dm = await interaction.member.createDM();
    const messages = await client.channels.cache.get(dm.id).messages.fetch({ limit: 100 });

    for (const msg of messages.values()) {
      if (msg.author.bot) {
        await msg.delete();
        quantidadeApagada++;
      }
    }

    if (quantidadeApagada === 0) {
      await interaction.editReply(`<:crosshost2:1384349772386664550> | ¡No se encontraron mensajes!`);
      return;
    }

    await interaction.editReply(`<:checkwhite:1374234754366570576> | Total de mensajes eliminados: ${quantidadeApagada}`);
  }
}
