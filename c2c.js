"use strict";

const clickToCall = {
  config: null,
  modal: {
    templates: [
      {
        container: `<div id="phone-modal" class="c2c-modal phone--modal modal--open">
                      <button role="button" class="close-modal">&times;</button>
                        <h1>!!heading!!</h1>
                        <p>!!body!!</p>
                        <button role="button" style="background-color:!!themeColor!!;" id="click-to-call"><a href="tel:+1!!phoneNumber!!">!!buttonText!!</a></button>
                    </div>`,
      },
    ],
    methods: {
      closeModal(evTarget) {
        evTarget.classList.remove("modal--open");
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
      buildTemplate(index) {
        const template = clickToCall.modal.templates[index];
        //save our processed HTML + combine
        clickToCall.processTemplateString(clickToCall.config.modal, template);
        template.processedTemplate = template.container;

        //create + append it
        const modalContainer = document.createElement("div");
        modalContainer.id = "modal-container"
        modalContainer.innerHTML = template.processedTemplate;
        document.body.appendChild(modalContainer);
      },
      initModal() {
        const modalBg = document.createElement("div");
        modalBg.setAttribute("style", "background:rgba(0,0,0,0.5);position:fixed;height:100%;width:100%; z-index:998");
        clickToCall.modal.modalBg = modalBg;
        if (!this.getModalClosedState()) {
          document.body.appendChild(modalBg);
          //accepts template index
          //builds the modal HTML
          this.buildTemplate(0);

          const modal = document.querySelector("#phone-modal");
          modal.querySelectorAll(".close-modal").forEach((btn, arr, i, modal) => {
            btn.addEventListener("click", function (e) {
              //"this" gets bound to click event target
              //need to actually reference c2c object
              clickToCall.modal.methods.closeModal(
                e.target.closest(".c2c-modal")
              );
            });
          });

        } else {
          clickToCall.phoneWidget.methods.initPhoneWidget();
        }
      },
    },
  },
  phoneWidget: {
    templates: [
      {
        container: `<div id="phone-widget" class="c2c-widget phone--widget">
                      <button id="widget-click-to-call" class="phone-button" role="button" style="background-color:!!themeColor!!;border-color:!!themeColor!!">
                        <span id="phone-icon" class="icon">
                          <img src='!!openIcon!!' alt='Click to Call icon'/>
                        </span>
                        <span id="close-icon" class="icon" style="display: none;">
                          <img src='!!closeIcon!!' alt='Click to Call icon'/>
                        </span>
                      </button>

                      !!tooltip!!
                    </div>
                 
                `,
        tooltip: `<div id="widget-tooltip" class="tooltip">
                    <h5>!!heading!!</h5>
                    <p>!!body!!</p>
                    <button class="tooltip-button" role="button" style="background-color:!!themeColor!!;">
                      <a href="tel: +1!!phoneNumber!!">!!buttonText!!</a>
                    </button>
                  </div>`,
      },
    ],
    timeoutID: null,
    methods: {
      buildTemplate(index) {
        const template = clickToCall.phoneWidget.templates[index];
        //save our processed HTML + combine
        clickToCall.processTemplateString(clickToCall.config.phoneWidget, template);
        template.processedTemplate = template.container.replace("!!tooltip!!", template.tooltip);

        //create + append it
        const phoneWidgetContainer = document.createElement("div");
        phoneWidgetContainer.id = "phone-widget-container"
        phoneWidgetContainer.innerHTML = template.processedTemplate;
        document.body.appendChild(phoneWidgetContainer);
      },
      initPhoneWidget() {
        //accepts template index
        //builds the modal HTML
        this.buildTemplate(0);
        const phoneWidget = document.querySelector("#phone-widget");
        const phoneWidgetButton = phoneWidget.querySelector("button");
        const phoneWidgetIcons = phoneWidgetButton.querySelectorAll(".icon");
        const phoneWidgetTooltipButton = document.querySelector("#widget-tooltip").querySelector("button");
        //found that the phone animation is best at double the duration of the pulse
        phoneWidgetIcons.forEach((icon) => {
          icon.style.animationDuration = `${clickToCall.config.widgetCssAnimationTiming * 2
            }s`;
        });

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
        const widgetTooltip = document.querySelector("#widget-tooltip");
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
          const button = document.querySelector("#widget-click-to-call");
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
        const button = document.querySelector("#widget-click-to-call");
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
  processTemplateString(templateConfigObj, templateObj) {
    Object.keys(templateObj).forEach((templateObjKey) => {
      let target = templateObj[templateObjKey];
      for (const prop of Object.keys(templateConfigObj)) {
        target = target.replaceAll(`!!${prop}!!`, templateConfigObj[prop])
      }
      target = target.replaceAll("!!phoneNumber!!", `+1${clickToCall.config.phoneNumber}`)
      target = target.replaceAll("!!themeColor!!", `${clickToCall.config.themeColor}`)
      templateObj[templateObjKey] = target;
    })
  },
  async init(config) {
    //may need to check config for validity
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
  },
};


window.clickToCall = clickToCall || {};
