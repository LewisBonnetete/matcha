import nodemailer from "nodemailer";

async function sendEmail(data) {
  let transporter = nodemailer.createTransport({
    name: "smtp-relay.sendinblue.com",
    host: "smtp-relay.sendinblue.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  let info = await transporter.sendMail({
    from: "Matcha<foo@example.com>",
    to: data.receiver,
    subject: data.subject,
    text: data.body,
  });
}

function getExludeId(user, matches) {
  let tab = [];
  if (user.blocks.length > 0) {
    for (let i = 0; i < user.blocks.length; i++) {
      tab.push(user.blocks[i].blocked_id);
    }
  }
  if (user.reports.length > 0) {
    for (let i = 0; i < user.reports.length; i++) {
      tab.push(user.reports[i].reported_id);
    }
  }
  if (matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      tab.push(matches[i].id);
    }
  }
  const uniq = [...new Set(tab)];
  return uniq;
}

function convertObjectToArray(object) {
  const keys = Object.keys(object)
  let result = {}
  result.data = []
  result.key = []
  for (let i = 0; i < keys.length; i++) {
    result.key.push(keys[i])
    result.data.push(object[keys[i]])
  }
  return result
}

export { sendEmail, getExludeId, convertObjectToArray };
