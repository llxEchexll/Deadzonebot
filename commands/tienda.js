// commands/tienda.js
import {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType
} from 'discord.js';
import db from '../database.js';

const categorias = {
  armas: [
    { name: 'AK-74', price: 50 },
    { name: 'M4A1', price: 60 },
    { name: 'Mosín', price: 40 }
  ],
  medicinas: [
    { name: 'Botiquín', price: 20 },
    { name: 'Morfina', price: 15 },
    { name: 'Vendaje', price: 5 }
  ],
  chalecos: [
    { name: 'Chaleco táctico', price: 45 },
    { name: 'Chaleco antibalas', price: 70 }
  ],
  ropa: [
    { name: 'Ropa camuflada', price: 30 },
    { name: 'Traje Ghillie', price: 90 }
  ],
  vehiculos: [
    { name: 'Sedán', price: 120 },
    { name: 'Camión V3S', price: 200 }
  ]
};

export default {
  data: new SlashCommandBuilder()
    .setName('tienda')
    .setDescription('🛒 Accedé a la tienda DayZ'),

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('login_tienda')
      .setTitle('🛒 Iniciar sesión')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('steamid')
            .setLabel('📄 Steam ID')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('password')
            .setLabel('🔒 Contraseña')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );

    await interaction.showModal(modal);

    const modalSubmit = await interaction.awaitModalSubmit({ time: 60_000 });
    const steamid = modalSubmit.fields.getTextInputValue('steamid');
    const password = modalSubmit.fields.getTextInputValue('password');

    let result = await db.query('SELECT * FROM usuarios WHERE steamid = $1', [steamid]);

    if (result.rowCount === 0) {
      await db.query('INSERT INTO usuarios (steamid, password, argentums) VALUES ($1, $2, $3)', [steamid, password, 0]);
      await modalSubmit.reply('🆕 Cuenta creada. Actualmente tenés **0 Argentums**. Usá /darargentum para obtener monedas.');
      return;
    }

    if (result.rows[0].password !== password) {
      return modalSubmit.reply({ content: '❌ Contraseña incorrecta.', ephemeral: true });
    }

    const selectCategorias = new StringSelectMenuBuilder()
      .setCustomId(`categoria_select_${steamid}`)
      .setPlaceholder('📂 Elegí una categoría')
      .addOptions(
        Object.keys(categorias).map(cat => ({
          label: cat.charAt(0).toUpperCase() + cat.slice(1),
          value: cat
        }))
      );

    const row = new ActionRowBuilder().addComponents(selectCategorias);
    await modalSubmit.reply({ content: '📦 Elegí una categoría para comprar:', components: [row], ephemeral: true });

    const categoryInteraction = await modalSubmit.channel.awaitMessageComponent({
      filter: i => i.customId.startsWith(`categoria_select_${steamid}`),
      time: 30_000
    });

    const categoriaElegida = categoryInteraction.values[0];
    const items = categorias[categoriaElegida];

    const selectItems = new StringSelectMenuBuilder()
      .setCustomId(`item_select_${steamid}`)
      .setPlaceholder('🛍 Elegí un ítem')
      .addOptions(
        items.map(item => ({
          label: item.name,
          description: `${item.price} Argentums`,
          value: JSON.stringify(item)
        }))
      );

    const row2 = new ActionRowBuilder().addComponents(selectItems);
    await categoryInteraction.reply({ content: `🎯 Elegiste **${categoriaElegida}**. Ahora seleccioná un ítem:`, components: [row2], ephemeral: true });

    const itemInteraction = await categoryInteraction.channel.awaitMessageComponent({
      filter: i => i.customId.startsWith(`item_select_${steamid}`),
      time: 30_000
    });

    const selectedItem = JSON.parse(itemInteraction.values[0]);
    const saldoActual = result.rows[0].argentums;

    if (saldoActual < selectedItem.price) {
      return itemInteraction.reply({ content: `❌ No tenés suficientes Argentums. Te faltan **${selectedItem.price - saldoActual}**.`, ephemeral: true });
    }

    await db.query('UPDATE usuarios SET argentums = argentums - $1 WHERE steamid = $2', [selectedItem.price, steamid]);

    await itemInteraction.reply({
      content: `🎉 ¡Gracias por tu compra de **${selectedItem.name}**!
💰 Te quedan **${saldoActual - selectedItem.price} Argentums**.

📦 El ítem será entregado por el staff pronto.`,
      ephemeral: true
    });
  }
};