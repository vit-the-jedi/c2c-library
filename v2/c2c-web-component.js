"use strict";

class PhoneModal {
    config = {};
    get config() {
        return this.config;
    }
    /**
     * configuration setter.
     * @param {Object} userConfig - The user provided configurations for the modal.
     */
    set config(userConfig) {
        this.config = userConfig;
    }
}

const c2cInit = (config) => {
    const c2cModal = new PhoneModal();
    c2cModal.config = config;
    console.log(c2cModal.config);
}
