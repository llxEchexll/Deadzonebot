import { SlashCommandBuilder } from 'discord.js';
import db from '../database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('argentums')
    .setDescription('🪙 Ver cuántos argentums tenés')
    .addStringOption(opt => opt.setName('steamid').setDescription('Tu Steam ID').setRequired(true))
    .addStringOption(opt => opt.setName('password').setDescription('Tu contraseña').setRequired(true)),

  async execute(interaction) {
    const steamid = interaction.options.getString('steamid');
    const password = interaction.options.getString('password');

    const result = await db.query('SELECT * FROM usuarios WHERE steamid = $1', [steamid]);

    if (result.rowCount === 0) {
      await db.query('INSERT INTO usuarios (steamid, password, argentums) VALUES ($1, $2, $3)', [steamid, password, 0]);
      return interaction.reply(`🆕 Cuenta creada para SteamID \`${steamid}\` con contraseña. Actualmente tenés **0 Argentums**.`);
    }

    if (result.rows[0].password !== password) {
      return interaction.reply({ content: '❌ Contraseña incorrecta.', ephemeral: true });
    }

    await interaction.reply(`💰 Tenés **${result.rows[0].argentums} Argentums**.`);
  }
};
