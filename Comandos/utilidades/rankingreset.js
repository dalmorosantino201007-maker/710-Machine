// --- DENTRO DE client.on('interactionCreate', async (interaction) => { ---
// --- BUSCA LA SECCIÓN if (interaction.isCommand()) { ---

        // --- NUEVO: COMANDO /RANKINGRESET ---
        if (interaction.commandName === "rankingreset") {
            // Solo los que tienen el rol de admin de reenvío pueden usarlo
            if (!interaction.member.roles.cache.has(rolAdminReenvio)) {
                return interaction.reply({ content: "❌ No tienes el rango necesario para resetear el ranking.", ephemeral: true });
            }

            try {
                fs.writeFileSync(rankingPath, JSON.stringify({}, null, 2));
                return interaction.reply({ content: "✅ El ranking de Staff ha sido reseteado a 0 correctamente." });
            } catch (error) {
                return interaction.reply({ content: "❌ Error al intentar resetear el archivo.", ephemeral: true });
            }
        }