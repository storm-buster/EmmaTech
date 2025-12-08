var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/email.ts
var email_exports = {};
__export(email_exports, {
  sendEmail: () => sendEmail,
  sendTeamNotification: () => sendTeamNotification,
  sendWaitlistConfirmation: () => sendWaitlistConfirmation
});
module.exports = __toCommonJS(email_exports);
async function sendEmail(data) {
  console.log("Email would be sent:", {
    to: data.to,
    subject: data.subject,
    body: data.body
  });
  return true;
}
async function sendWaitlistConfirmation(email, fullName) {
  const emailData = {
    to: email,
    subject: "Welcome to the RAPHA Waitlist",
    body: `
      Hi ${fullName},

      Thank you for joining the RAPHA waitlist!

      We're excited to have you on board. You'll be among the first to know when RAPHA becomes available.

      In the meantime, stay tuned for updates about our revolutionary autonomous cyber defense platform.

      Best regards,
      The EmmaTech Team

      ---
      DETECT. DECEIVE. DEFEND.
    `
  };
  return sendEmail(emailData);
}
async function sendTeamNotification(fullName, email, organization, contactNumber) {
  const emailData = {
    to: "team@emmatech.com",
    subject: "New Waitlist Signup",
    body: `
      New waitlist signup:

      Name: ${fullName}
      Email: ${email}
      Organization: ${organization}
      Contact Number: ${contactNumber || "Not provided"}
      Timestamp: ${(/* @__PURE__ */ new Date()).toISOString()}
    `
  };
  return sendEmail(emailData);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  sendEmail,
  sendTeamNotification,
  sendWaitlistConfirmation
});
//# sourceMappingURL=email.js.map
