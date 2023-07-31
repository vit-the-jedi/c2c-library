"use strict";

const clickToCall = {
  config: null,
  modal: {
    target: null,
    methods: {
      closeModal() {
        clickToCall.modal.target.classList.remove("modal--open");
        document.body.removeChild(clickToCall.modal.modalBg);
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
          const modalBg = document.createElement("div");
          modalBg.setAttribute("style", "background:rgba(0,0,0,0.5);position:fixed;height:100%;width:100%; z-index:998");
          clickToCall.modal.modalBg = modalBg;
          if (!this.getModalClosedState()) {
            if (clickToCall.config.themeColor) {
              modal.querySelector(
                "#click-to-call"
              ).style.backgroundColor = `${clickToCall.config.themeColor}`;
            }

            //create text
            clickToCall.createText("modal");

            const modalButton = modal.querySelector("#click-to-call");
            modalButton.appendChild(clickToCall.createPhoneLink());

            modalButton.addEventListener("click", function (ev) {
              try {
                ev.target.querySelector("a").click();
              } catch (err) {
                //avoiding thrown error, even though the code works
              }
            });

            modal.classList.add("modal--open");
            document.body.appendChild(modalBg)
            modal.querySelectorAll(".close-modal").forEach((btn, arr, i, modal) => {
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
        const phoneWidgetButton = phoneWidget.querySelector("button");
        const phoneWidgetIcons = phoneWidgetButton.querySelectorAll(".icon");
        const phoneWidgetTooltipButton = document.querySelector("#widget-tooltip").querySelector("button");
        //add phone number and anchor tag
        phoneWidgetTooltipButton.appendChild(clickToCall.createPhoneLink());
        //found that the phone animation is best at double the duration of the pulse
        phoneWidgetIcons.forEach((icon) => {
          icon.style.animationDuration = `${clickToCall.config.widgetCssAnimationTiming * 2
            }s`;
        });
        //create text
        clickToCall.createText("phoneWidget");

        if (themeColor) {
          //set theme color to buttons
          phoneWidgetButton.style.backgroundColor = `${themeColor}`;
          phoneWidgetButton.style.borderColor = `${themeColor}`;
          clickToCall.phoneWidget.tooltip.querySelector(
            "button"
          ).style.backgroundColor = `${themeColor}`;
        } else {
          phoneWidgetButton.style.borderColor = `red`;
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
          button.style.animationDuration = `${clickToCall.config.widgetCssAnimationTiming}s`;
          button.classList.add("animate-button");
          //remove the class so we can animate again
          //convert css timing length to ms, then add a few hundred ms to it to make it smoothe
          clickToCall.phoneWidget.timeoutID = setTimeout(() => {
            resolve(true);
          }, clickToCall.config.widgetCssAnimationTiming * 1000 + 250);
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
        const widgetAnimationIntervalTiming =
          clickToCall.config?.widgetAnimationIntervalTiming || 6000;
        this.animationRunning = setInterval(function () {
          //"this" gets set to window inside setInterval
          clickToCall.phoneWidget.methods.animationHandler();
        }, widgetAnimationIntervalTiming);
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
        "Target modal HTML element can't be found, please check that the modal id in your config object is correct.\n\n Can't initilize modal.",
      nullPhoneWidget:
        "Target phone widget HTML element can't be found, please check that the phone widget id in your config object is correct.\n\n Can't initilize phone widget.",
      nullPhoneWidgetTooltip:
        "Target phone widget tooltip HTML element can't be found, please check that the phone widget tooltip id in your config object is correct.\n\n Can't initilize phone widget tooltip.",
      invalidConfig: `Invalid configuration object, please pass an object to clickToCall.init() with the follwing keys and valid HTML element id's as the values. See example object below \n
      const exampleConfig = {
          modalTarget: 'phone-modal',
          phoneWidgetTarget: 'phone-widget',
          tooltipId: 'widget-tooltip',\n
          //Optional values:
          //control the length between widget animations 
          widgetAnimationIntervalTiming: 5,
          //control the amount of time the widget animation takes
          widgetCssAnimationTiming: 1.5,
          //control the overall theme color of widget and modal buttons
          themeColor: 'rgb(35, 151, 56)'
      }\n
          `,
    },
    showError() {
      console.error(
        `Error: Click to Call JS \n\n ${this.errorMsgs[this.errorType]}`
      );
    },
  },
  createText(type) {
    let target;
    let headingType;
    if (type === "modal") {
      target = this.modal.target;
      headingType = "h1"
    } else {
      target = this.phoneWidget.tooltip;
      headingType = "h5"
    }

    const heading = document.createElement(headingType);
    heading.textContent = clickToCall.config[type].heading;
    const body = document.createElement("p");
    body.textContent = clickToCall.config[type].body;

    target.prepend(body);
    target.prepend(heading);
  },
  createPhoneLink() {
    const phoneLink = document.createElement("a");
    phoneLink.href = `tel:+1${this.config.phoneNumber}`;
    phoneLink.setAttribute("data-c2c-link", "")
    phoneLink.setAttribute("style", "display:block;width:100%;height:100%;text-decoration:none;color:inherit;")
    phoneLink.textContent = this.config.phoneNumber.replace(/^\+[0-9]/, '');
    return phoneLink;
  },
  checkConfigValidity(userConfig) {
    //each of these will short-circuit to null if document.querySelector fails
    const modalExists = document.querySelector(
      `#${userConfig?.modalTarget || null}`
    );
    const widgetExists = document.querySelector(
      `#${userConfig?.phoneWidgetTarget || null}`
    );
    const tooltipExists = document.querySelector(
      `#${userConfig?.tooltipId || null}`
    );
    //if our user provided config is null, or invalid
    if (
      !userConfig ||
      !userConfig.hasOwnProperty("modalTarget") ||
      !userConfig.hasOwnProperty("phoneWidgetTarget") ||
      !userConfig.hasOwnProperty("tooltipId")
    ) {
      this.errors.errorType = "invalidConfig";
      this.errors.showError();
      return false;
    }
    //is any of our mandatory HTML elements are not present in the DOM
    else if (!modalExists) {
      this.errors.errorType = "nullModal";
      this.errors.showError();
      return false;
    } else if (!widgetExists) {
      this.errors.errorType = "nullPhoneWidget";
      this.errors.showError();
      return false;
    } else if (!tooltipExists) {
      this.errors.errorType = "nullPhoneWidgetTooltip";
      this.errors.showError();
      return false;
    } else {
      return true;
    }
  },
  async init(config) {
    //only initialize if we don't have config errors
    if (this.checkConfigValidity(config)) {
      this.modal.target = document.querySelector(`#${config.modalTarget}`);
      this.phoneWidget.target = document.querySelector(
        `#${config.phoneWidgetTarget}`
      );
      this.phoneWidget.tooltip = document.querySelector(`#${config.tooltipId}`);
      //optinal values
      config.widgetAnimationIntervalTiming =
        config?.widgetAnimationIntervalTiming * 1000 || 6000;
      config.widgetCssAnimationTiming = config?.widgetCssAnimationTiming || 1.5;
      config.themeColor = config?.themeColor;

      //if we don't have a user provided phone number, go get one 
      if (!config?.phoneNumber) {
        //conditional API call
        const getPhoneNumber = fetch("https://catfact.ninja/fact").then((resp) => {
          return resp.json();
        });

        getPhoneNumber.then((data) => {
          config.phoneNumber = data;
          console.log(data);
          //expose config
          this.config = config;
          //initialize
          this.modal.methods.initModal();
          console.log(`Click to Call JS initialized.`);
        });

      } else {
        //expose config
        this.config = config;
        //initialize
        this.modal.methods.initModal();
        console.log(`Click to Call JS initialized.`);
      }

    } else {
      console.log(`Click to Call JS initialization failed.`);
    }
  },
};


window.clickToCall = clickToCall || {};
