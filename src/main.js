#!/usr/bin/env node

const nodemailer = require('nodemailer');
const fs = require('fs');
const minimist = require('minimist');

function main() {
  const args = minimist(process.argv.slice(2));
  /**
   * -h HELP!!!
   * -m [path to msg.txt]
   * -p // no arg | send mailing no test mode
   * -s [subject]
   * -r [path to receivers.csv]
   * -c [path to config.json]
   */

  if (args.h) {
    console.log(' -h HELP!!!, -m [path to msg.txt], -p // no arg | send mailing no test mode, -s [subject], -r [path to receivers.csv], -c [path to config.json]');
    return;
  }

  if (!args.c) {
    console.error("please provide -c path to config use -h for help ");
    return;
  }

  const config = JSON.parse(get_file_content(args.c));

  if (!args.m) {
    console.error("please provide -m use -h for help");
    return;
  }

  const message = get_file_content(args.m);
  const subject = args.s

  if (!message || !subject) {
    console.error("please provide -s and -m use -h for help");
    return;
  }

  if (args.p) {
    if (!args.r) {
      console.error("please provide -r use -h for help");
      return;
    }

    const receivers = get_receivers_from_csv(args.r);

    if (!receivers) {
      console.error("no receivers found!");
      return;
    }

    mailing(message, subject, receivers, config);
    return;
  }

  test_mail(message, subject, config);
}

function send_mail_plain(sender, receivers, subject, message, user, pass, host, port) {
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: false, // true for 465, false for other ports
    auth: {
      user, // generated ethereal user
      pass // generated ethereal password
    }
  });

  return transporter.sendMail({
    from: `"${sender}" <${user}>`, // sender address
    to: receivers, // list of receivers
    subject, // Subject line
    text: message, // plain text body
  });
}

function send_mailing_plain(sender, receivers, subject, message, user, pass, host, port) {
  // TODO: show progress and handle promise rejection  
  const delay = 2 * 1000;
  const numEmailsToSend = receivers.length;

  let emailsSend = 0;
  let emailsFailed = 0;

  const failedReceivers = [];

  receivers.forEach((receiver, i) => {
    setTimeout(() => {
      console.log(`sending ${i + 1} of ${numEmailsToSend}`)
      send_mail_plain(sender, receiver, subject, message, user, pass, host, port).then(() => {
        console.log(`email to ${receiver} send`);
        emailsSend += 1;
      }).catch(() => {
        console.log(`sending email to ${receiver} failed`);
        emailsFailed += 1;
        failedReceivers.push(receiver);
      }).finally(() => {
        if (emailsFailed + emailsSend === numEmailsToSend) {
          console.log("process finished");
          console.log(`${emailsSend} emails send`);
          console.log(`${emailsFailed} emails failed`);
          if (failedReceivers.length > 0) {
            console.log(`failed Receivers: ${failedReceivers}`);
          }
        }
      });
    }, i * delay);

  })
}

function test_mail(message, subject, config) {
  console.log(`sending test message to ${config.testReceiver}`);
  send_mail_plain(config.sender, config.testReceiver, subject, message, config.email, config.password, config.smtp, config.port);
}

function mailing(message, subject, receivers, config) {
  send_mailing_plain(config.sender, receivers, subject, message, config.email, config.password, config.smtp, config.port)
}

function get_file_content(filePath) {
  const fileContent = fs.readFileSync(filePath, { encoding: 'utf8' });
  return fileContent;
}

function get_receivers_from_csv(filePath) {
  const fileContent = fs.readFileSync(filePath, { encoding: 'utf8' });
  const lines = fileContent.split('\n')
  const l = lines.map((a) => a.replace('\n', "").replace('\r', ""));
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  const emails = l.filter((line) => re.test(line))
  const uniqueEmails = emails.filter((i, p) => emails.indexOf(i) === p);

  return uniqueEmails;
}

try {
  main()
} catch (e) {
  console.error(e)
}
