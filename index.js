import 'dotenv/config';
import { Client, GatewayIntentBits, Events } from 'discord.js';
import * as tiendaCmd from './commands/tienda.js';
import { initDB } from './db.js';

const config = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID
};

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async () => {
  await initDB();
  console.log(`✨ ¡Bot conectado como ${client.user.tag}! ✨`);
});

client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'tienda') {
        await tiendaCmd.execute(interaction);
      }
      if (interaction.commandName === 'darargentum') {
        await tiendaCmd.darArgentum(interaction);
      }
      if (interaction.commandName === 'argentum') {
        await tiendaCmd.argentum(interaction);
      }
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'categoria_tienda') {
      await tiendaCmd.handleCategoria(interaction);
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('comprar_item_')) {
      await tiendaCmd.handleSelect(interaction);
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('steamid_modal_')) {
      await tiendaCmd.handleModal(interaction);
    }
  } catch (error) {
    console.error('Error en interacción:', error);
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: '❌ Hubo un error procesando tu interacción.', flags: 4096 });
    } else {
      await interaction.reply({ content: '❌ Hubo un error procesando tu interacción.', flags: 4096 });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);