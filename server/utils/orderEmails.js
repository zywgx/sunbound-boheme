import nodemailer from 'nodemailer'

function getMailConfig() {
  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
    notifyTo: process.env.ORDER_NOTIFY_TO,
  }
}

function isMailConfigured(config) {
  return Boolean(config.host && config.port && config.user && config.pass && config.from)
}

function createTransporter(config) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  })
}

function formatAddress(order) {
  return [
    order.shippingLine1,
    order.shippingLine2,
    [order.shippingCity, order.shippingState, order.shippingPostalCode]
      .filter(Boolean)
      .join(', '),
    order.shippingCountry,
  ]
    .filter(Boolean)
    .join('\n')
}

function formatItems(order) {
  return (order.items || [])
    .map((item) => `${item.quantity} x ${item.name} - $${Number(item.price).toFixed(2)}`)
    .join('\n')
}

async function sendMail(message) {
  const config = getMailConfig()

  if (!isMailConfigured(config)) {
    return
  }

  const transporter = createTransporter(config)
  await transporter.sendMail(message)
}

export async function sendCustomerOrderEmail(order) {
  if (!order.customerEmail) {
    return
  }

  const config = getMailConfig()

  await sendMail({
    from: config.from,
    to: order.customerEmail,
    subject: `Your SUNBOUND BOHEME order #${order.id}`,
    text: [
      `Hi ${order.customerName || 'there'},`,
      '',
      'Thank you for your order with SUNBOUND BOHEME.',
      `Order #: ${order.id}`,
      `Total: $${Number(order.total).toFixed(2)}`,
      '',
      'Items:',
      formatItems(order),
      '',
      'Shipping to:',
      formatAddress(order) || 'Address will be confirmed separately.',
      '',
      'We will email again if there is an update with your shipment.',
    ].join('\n'),
  })
}

export async function sendInternalOrderNotification(order) {
  const config = getMailConfig()

  if (!config.notifyTo) {
    return
  }

  await sendMail({
    from: config.from,
    to: config.notifyTo,
    subject: `New SUNBOUND BOHEME order #${order.id}`,
    text: [
      'A new order was placed.',
      '',
      `Order #: ${order.id}`,
      `Customer: ${order.customerName || 'Not captured'}`,
      `Email: ${order.customerEmail || 'Not captured'}`,
      `Total: $${Number(order.total).toFixed(2)}`,
      '',
      'Ship to:',
      formatAddress(order) || 'Address not captured',
      '',
      'Items:',
      formatItems(order),
    ].join('\n'),
  })
}
