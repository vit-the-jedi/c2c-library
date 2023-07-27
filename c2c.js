"use strict";

const clickToCall = {
  interval: 0,
  config: null,
  modal: {
    target: null,
    methods: {
      closeModal() {
        clickToCall.modal.target.classList.remove("modal--open");
        this.saveModalClosedState();
        clickToCall.phoneWidget.methods.initPhoneWidget();
      },
      getModalClosedState() {
        return JSON.parse(sessionStorage.getItem("c2c-modal-closed")) === true
          ? true
          : false;
      },
      saveModalClosedState() {
        sessionStorage.setItem("c2c-modal-closed", true);
      },
      initModal() {
        const modal = clickToCall.modal.target;
        if (!clickToCall.modal.target || !modal) {
          clickToCall.errors.errorType = "nullModal";
          clickToCall.errors.showError();
        } else {
          if (!this.getModalClosedState()) {
            if (clickToCall.config.themeColor) {
              modal.querySelector(
                "#click-to-call"
              ).style.backgroundColor = `${clickToCall.config.themeColor}`;
            }
            setTimeout(() => {
              modal.classList.add("modal--open");
            }, 1000);
            modal
              .querySelectorAll(".close-modal")
              .forEach((btn, arr, i, modal) => {
                btn.addEventListener("click", function (e) {
                  //"this" gets bound to click event target
                  //need to actually reference c2c object
                  clickToCall.modal.methods.closeModal(
                    e.target.closest(".modal")
                  );
                });
              });
          } else {
            clickToCall.phoneWidget.methods.initPhoneWidget();
          }
        }
      },
    },
  },
  phoneWidget: {
    target: null,
    tooltip: null,
    timeoutID: null,
    methods: {
      initPhoneWidget() {
        const phoneWidget = clickToCall.phoneWidget.target;
        const themeColor = clickToCall.config?.themeColor;
        if (!clickToCall.phoneWidget.target || !phoneWidget) {
          clickToCall.errors.errorType = "nullPhoneWidget";
          clickToCall.errors.showError();
        } else if (!clickToCall.phoneWidget.tooltip) {
          clickToCall.errors.errorType = "nullPhoneWidgetTooltip";
          clickToCall.errors.showError();
        } else {
          const phoneWidget = clickToCall.phoneWidget.target;
          const phoneWidgetButton = phoneWidget.querySelector("button");
          const phoneWidgetIcons = phoneWidgetButton.querySelectorAll(".icon");
          //found that the phone animation is best at double the duration of the pulse
          phoneWidgetIcons.forEach((icon) => {
            icon.style.animationDuration = `${
              clickToCall.config.cssAnimationTiming * 2
            }s`;
          });
          if (themeColor) {
            //set theme color to buttons
            phoneWidgetButton.style.backgroundColor = `${themeColor}`;
            phoneWidgetButton.style.borderColor = `${themeColor}`;
            clickToCall.phoneWidget.tooltip.querySelector(
              "button"
            ).style.backgroundColor = `${themeColor}`;
          }
          phoneWidget.classList.add("open");
          this.beginWidgetAnimationInterval(phoneWidget);
          phoneWidget
            .querySelector("button")
            .addEventListener("click", function (e) {
              //"this is bound to click event target"
              //need to actually reference c2c object
              clickToCall.phoneWidget.methods.openPhoneWidget();
            });
        }
      },
      openPhoneWidget(clicked) {
        const widgetTooltip = clickToCall.phoneWidget.tooltip;
        if (!clickToCall.phoneWidget.tooltip || !widgetTooltip) {
          clickToCall.errors.errorType = "";
        }
        if (!widgetTooltip.classList.contains("open")) {
          widgetTooltip.classList.add("open");
          document.querySelector("#phone-icon").style.display = "none";
          document.querySelector("#close-icon").style.display = "block";
          this.stopWidgetAnimationInterval(this.animationRunning);
        } else {
          document.querySelector("#phone-icon").style.display = "block";
          document.querySelector("#close-icon").style.display = "none";
          widgetTooltip.classList.remove("open");
          this.beginWidgetAnimationInterval(
            document.querySelector("#phone-widget")
          );
        }
      },
      addAnimation() {
        //must be promise based - we need to await the completion of the setTimeout in animationHandler
        //once we resolve() we have to clear the timeout, or else it runs infinitely every few seconds and blocks
        //any further animations
        return new Promise((resolve) => {
          const button = clickToCall.phoneWidget.target.querySelector("button");
          button.style.animationDuration = `${clickToCall.config.cssAnimationTiming}s`;
          button.classList.add("animate-button");
          //remove the class so we can animate again
          //convert css timing length to ms, then add a few hundred ms to it to make it smoothe
          clickToCall.phoneWidget.timeoutID = setTimeout(() => {
            resolve(true);
          }, clickToCall.config.cssAnimationTiming * 1000 + 250);
        });
      },
      removeAnimation() {
        //use a global id set in the phoneWidget object to reference the timeout function
        clearTimeout(clickToCall.phoneWidget.timeoutID);
        const button = clickToCall.phoneWidget.target.querySelector("button");
        button.classList.remove("animate-button");
      },
      async animationHandler() {
        //await the full cycle animation
        await this.addAnimation();
        //remove the animation class + clear timeout
        this.removeAnimation();
      },
      beginWidgetAnimationInterval() {
        //check if animationInterval is passed in config, else default
        const animationIntervalTiming =
          clickToCall.config?.animationIntervalTiming || 6000;
        this.animationRunning = setInterval(function () {
          //"this" gets set to window inside setInterval
          clickToCall.phoneWidget.methods.animationHandler();
        }, animationIntervalTiming);
      },
      stopWidgetAnimationInterval(interval) {
        //clear out interval to stop the animation
        //occurs when the user opens up the widget tooltip
        clearInterval(interval);
      },
    },
  },
  errors: {
    errorType: null,
    errorMsgs: {
      nullModal:
        "Target modal HTML element is null, please check that the HTML modal id in your config object is correct.\n\n Can't initilize modal.",
      nullPhoneWidget:
        "Target phone widget HTML element is null, please check that the HTML phone widget id in your config object is correct.\n\n Can't initilize phone widget.",
      nullPhoneWidgetTooltip:
        "Target phone widget tooltip HTML element is null, please check that the HTML phone widget tooltip id in your config object is correct.\n\n Can't initilize phone widget tooltip.",
      invalidConfig: `Invalid configuration object, please pass an object to clickToCall.init() with the follwing keys and valid HTML element id's as the values. See example object below \n
      const exampleConfig = {
          modalTarget: 'phone-modal',
          phoneWidgetTarget: 'phone-widget',
          tooltipId: 'widget-tooltip',
      }\n\n`,
    },
    showError() {
      console.error(
        `Error: Click to Call JS \n\n ${this.errorMsgs[this.errorType]}`
      );
    },
  },
  init(config) {
    if (
      !config ||
      !config.hasOwnProperty("modalTarget") ||
      !config.hasOwnProperty("phoneWidgetTarget") ||
      !config.hasOwnProperty("tooltipId") ||
      !document.querySelector(`#${config.modalTarget}`) ||
      !document.querySelector(`#${config.phoneWidgetTarget}`) ||
      !document.querySelector(`#${config.tooltipId}`)
    ) {
      this.errors.errorType = "invalidConfig";
      this.errors.showError();
    } else {
      this.modal.target = document.querySelector(`#${config.modalTarget}`);
      this.phoneWidget.target = document.querySelector(
        `#${config.phoneWidgetTarget}`
      );
      this.phoneWidget.tooltip = document.querySelector(`#${config.tooltipId}`);
      //optinal values
      config.animationIntervalTiming =
        config?.animationIntervalTiming * 1000 || 6000;
      config.cssAnimationTiming = config?.cssAnimationTiming || 1.5;
      config.themeColor = config?.themeColor;
      //expose config
      this.config = config;
      //initialize
      this.modal.methods.initModal();
      console.log(`Click to Call JS initialized.`);
      console.log(this);
    }
  },
};

window.clickToCall = clickToCall || {};
