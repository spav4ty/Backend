const nodemailer = require('nodemailer');

const sendEmail = async options => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'testspav4@gmail.com',
      pass: 'Max2005@)@!'
    }
  });

  // 2) Define the email options
  const mailOptions = {
    from: 'Nikita Tsyklinskiy <ntsyklinskiy@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
    // html:
  };

  // console.log(mailOptions);
  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
