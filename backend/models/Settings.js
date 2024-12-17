const BaseModel = require('./BaseModel');

class Settings extends BaseModel {
  constructor() {
    super('settings');
  }

  async getSettings() {
    const [settings] = await this.findAll({ limit: 1 });
    return settings || null;
  }

  async updateSettings(data) {
    const settings = await this.getSettings();
    if (settings) {
      return this.update(settings.id, data);
    }
    return this.create(data);
  }

  // Helper method to get specific setting
  async getSetting(key) {
    const settings = await this.getSettings();
    return settings ? settings[key] : null;
  }

  // Helper method to update specific setting
  async updateSetting(key, value) {
    const settings = await this.getSettings();
    if (settings) {
      const updatedData = { ...settings, [key]: value };
      return this.update(settings.id, updatedData);
    }
    return this.create({ [key]: value });
  }
}

module.exports = new Settings(); 