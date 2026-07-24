const nodemailer = require('nodemailer')

const createTransporter = async () => {
  // For development/testing without mail server, return a mock transporter
  if (!process.env.SMTP_HOST && !process.env.ETHEREAL_USER) {
    return {
      sendMail: async (options) => ({
        messageId: `mock-${Date.now()}`,
        response: 'Mock email sent (no SMTP configured)',
        ...options
      })
    }
  }

  // For development/testing, use Ethereal Email (fake SMTP)
  if (process.env.ETHEREAL_USER && process.env.ETHEREAL_PASS) {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.ETHEREAL_USER,
        pass: process.env.ETHEREAL_PASS
      }
    })
  }

  // Production: use environment-provided SMTP or Gmail
  const transport = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  }

  return nodemailer.createTransport(transport)
}

const sendTestEmail = async (toEmail) => {
  const transporter = await createTransporter()

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || 'test@dreamleaguefinance.local',
    to: toEmail,
    subject: '[DREAM LEAGUE FINANCE] TEST EMAIL',
    html: '<h1>Test Email</h1><p>This is a test email from Dream League Finance.</p>'
  })

  return info
}

module.exports = {
  sendTestEmail
}
