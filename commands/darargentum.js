import { SlashCommandBuilder } from 'discord.js';
import db from '../database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('darargentum')
    .setDescription('💰 Dar argentums a un usuario (solo admins)')
    .addStringOption(opt => opt.setName('steamid').setDescription('Steam ID del usuario').setRequired(true))
    .addIntegerOption(opt => opt.setName('cantidad').setDescription('Cantidad de argentums').setRequired(true)),

  async execute(interaction) {
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({ content: '🚫 Solo admins pueden usar este comando.', ephemeral: true });
    }

    const steamid = interaction.options.getString('steamid');
    const cantidad = interaction.options.getInteger('cantidad');

    const result = await db.query('SELECT * FROM usuarios WHERE steamid = $1', [steamid]);

    if (result.rowCount === 0) {
      await db.query('INSERT INTO usuarios (steamid, argentums) VALUES ($1, $2)', [steamid, cantidad]);
    } else {
      await db.query('UPDATE usuarios SET argentums = argentums + $1 WHERE steamid = $2', [cantidad, steamid]);
    }

    await interaction.reply(`✅ Se asignaron **${cantidad} Argentums** a SteamID \`${steamid}\`.`);
  }
};
