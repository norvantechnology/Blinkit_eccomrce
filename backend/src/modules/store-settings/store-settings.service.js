const fs = require('fs');
const path = require('path');
const repo = require('./store-settings.repository');

const KEY_EN = 'account_privacy_policy_md_en';
const KEY_HI = 'account_privacy_policy_md_hi';

const defaultMarkdown = () => {
  const file = path.join(__dirname, '../../../content/account-privacy-policy.default.md');
  try {
    return fs.readFileSync(file, 'utf8').trim();
  } catch {
    return 'We are committed to protecting your privacy and personal information.';
  }
};

const localeKey = (locale) => (locale === 'hi' ? KEY_HI : KEY_EN);

const getPrivacyPolicy = async (locale = 'en') => {
  const key = localeKey(locale);
  let markdown = await repo.getSetting(key);
  if (!markdown && locale === 'hi') {
    markdown = await repo.getSetting(KEY_EN);
  }
  if (!markdown) {
    markdown = defaultMarkdown();
  }
  const excerpt = markdown.split(/\n\n+/)[0]?.replace(/\*\*/g, '') || markdown.slice(0, 320);
  return {
    locale: locale === 'hi' ? 'hi' : 'en',
    title: locale === 'hi' ? 'खाता गोपनीयता और नीति' : 'Account privacy and policy',
    markdown,
    excerpt,
  };
};

const updatePrivacyPolicy = async ({ locale = 'en', markdown }) => {
  const key = localeKey(locale);
  await repo.setSetting(key, markdown.trim());
  return getPrivacyPolicy(locale);
};

const getAdminPrivacyPolicy = async () => ({
  en: await getPrivacyPolicy('en'),
  hi: await getPrivacyPolicy('hi'),
});

module.exports = {
  getPrivacyPolicy,
  updatePrivacyPolicy,
  getAdminPrivacyPolicy,
};
