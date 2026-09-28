/**
 * Copyright & DMCA policy — Single Source of Truth for /copyright.
 * Agent details come from SITE_CONFIG.copyrightAgent.
 */

import { SITE_CONFIG } from '../config';

const { appName, baseUrl, copyrightAgent } = SITE_CONFIG;

export const COPYRIGHT_TITLE = `Copyright & DMCA Policy · ${appName}`;

export const COPYRIGHT_LAST_UPDATED = '2026-09-28';

export const COPYRIGHT_REPORT_SUBJECT = 'DMCA notice';

export const COPYRIGHT_REPORT_MAILTO = `mailto:${copyrightAgent.email}?subject=${encodeURIComponent(COPYRIGHT_REPORT_SUBJECT)}`;

function agentBlock(): string {
  const lines = [
    copyrightAgent.name ? `Name: ${copyrightAgent.name}` : null,
    copyrightAgent.postalAddress ? `Address: ${copyrightAgent.postalAddress}` : null,
    copyrightAgent.phone ? `Phone: ${copyrightAgent.phone}` : null,
    `Email: ${copyrightAgent.email}`,
    copyrightAgent.registrationNumber
      ? `U.S. Copyright Office registration: ${copyrightAgent.registrationNumber}`
      : null,
  ];
  return lines.filter(Boolean).join('\n');
}

export const COPYRIGHT_SECTIONS = [
  {
    id: 'scope',
    title: '1. Scope',
    body: `This policy covers the ${appName} app and ${baseUrl}. We respect copyright and respond to notices that follow the U.S. Digital Millennium Copyright Act (17 U.S.C. § 512).

Today the app and site do not host content uploaded by other users. Text you type in the app stays on your device or in your own account. Images you pick in the website's ASO tools are processed in your browser and are not uploaded to us. If you still believe something we publish infringes your copyright, send a notice.`,
  },
  {
    id: 'agent',
    title: '2. Designated agent',
    body: `Send copyright notices to our designated agent:\n\n${agentBlock()}`,
  },
  {
    id: 'notice',
    title: '3. How to send a takedown notice',
    body: `Email the agent with the subject "${COPYRIGHT_REPORT_SUBJECT}". Include all of the following:

1. Your physical or electronic signature.
2. The copyrighted work you say is infringed.
3. The material you say is infringing, with a URL or enough detail for us to find it.
4. Your name, postal address, phone number and email.
5. A statement that you have a good-faith belief the use is not authorized by the copyright owner, its agent or the law.
6. A statement, under penalty of perjury, that the notice is accurate and that you are the owner or authorized to act for the owner.

Incomplete notices may not be processed. Knowingly false claims can make you liable for damages under 17 U.S.C. § 512(f).`,
  },
  {
    id: 'response',
    title: '4. What we do',
    body: `When we get a valid notice, we remove or disable access to the material quickly, and we tell the person who posted it (if any) and forward a copy of the notice.`,
  },
  {
    id: 'counter',
    title: '5. Counter-notice',
    body: `If your material was removed and you believe it was a mistake or misidentification, send the agent a counter-notice with:

1. Your physical or electronic signature.
2. The material removed and where it appeared before removal.
3. A statement, under penalty of perjury, that you have a good-faith belief it was removed by mistake or misidentification.
4. Your name, address and phone number, and a statement that you consent to the jurisdiction of the federal district court for your address (or, if outside the U.S., any district where we may be found), and that you will accept service of process from the person who sent the original notice.

We forward the counter-notice to the original sender. If they do not tell us within 10 business days that they have filed a court action, we may restore the material within 10 to 14 business days.`,
  },
  {
    id: 'repeat',
    title: '6. Repeat infringers',
    body: `We terminate, in appropriate circumstances, the accounts and access of users who are repeat infringers. An account that receives two valid notices that are not successfully countered within 12 months is closed.`,
  },
  {
    id: 'contact',
    title: '7. Other questions',
    body: `For anything that is not a copyright notice, email ${SITE_CONFIG.contactEmail}.`,
  },
] as const;
