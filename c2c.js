"use strict";

const clickToCall = {
  config: null,
  modal: {
    templates: [
      {
        container: `<div id="phone-modal" class="c2c-modal phone--modal">
                      <button role="button" class="close-modal">&times;</button>
                        <img class="modal-img" src="!!modalImg!!" alt="Click to Call icon"/>
                        <h1>!!heading!!</h1>
                        <div class="body-content">!!body!!</div>
                        <button role="button" style="background-color:!!themeColor!!;" id="click-to-call"><a href="tel:!!phoneNumber!!">!!buttonText!!</a>
                        </button>
                        <p class="tty-disclosure">!!tty!!</p>
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
        setTimeout(() => {
          modalContainer.querySelector(".c2c-modal").classList.add("modal--open")
        }, 1000)
      },
      initModal() {
        const modalBg = document.createElement("div");
        modalBg.setAttribute("style", "background:rgba(0,0,0,0.5);position:fixed;height:100%;width:100%; z-index:998;top:0;left:0");
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
                      <a href="tel:!!phoneNumber!!">!!buttonText!!</a>
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
        clickToCall.config.anchorPoint.appendChild(phoneWidgetContainer);
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
    //for each top-level object in the template, do the following
    Object.keys(templateObj).forEach((templateObjKey) => {
      let target = templateObj[templateObjKey];
      //loop through all keys in the nested objects within the template
      for (const prop of Object.keys(templateConfigObj)) {
        if (templateConfigObj[prop] instanceof Array) {
          let str = "";
          templateConfigObj[prop].forEach((p, i, arr) => {
            str += `<p class="body-item-${i + 1}">${p}</p>`;
            templateConfigObj[prop] = str;
          });
        } //replace the placeholder text w/ corresponding values from configs
        target = target.replaceAll(`!!${prop}!!`, templateConfigObj[prop]);

      }
      //these values occur more than once, so let's run a one-time replaceAll for each top-level object in the template
      target = target.replaceAll("!!phoneNumber!!", `+1${clickToCall.config.phoneNumber}`)
      target = target.replaceAll("!!parsedPhoneNumber!!", `${this.formatPhoneNumber(clickToCall.config.phoneNumber)}`)
      target = target.replaceAll("!!themeColor!!", `${clickToCall.config?.themeColor || 'red'}`)
      templateObj[templateObjKey] = target;
    })
  },
  formatPhoneNumber(phoneNumberString) {
    const cleaned = ('' + phoneNumberString).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return null;
  },
  checkTemplateConfigs(config) {
    const definedConfigs = {
      modal: null,
      phoneWidget: null,
    };
    //check if modal object is totally empty
    //check if any sub-prop is empty
    //push each empty prop into the array at corresponding key
    //repeat for phone widget
    if (config.modal) {
      definedConfigs.modal = Object.keys(config.modal).filter((key) => typeof config.modal[key] !== null);
    }
    if (config.phoneWidget) {
      definedConfigs.phoneWidget = Object.keys(config.phoneWidget).filter((key) => typeof config.phoneWidget[key] !== null);
    }
    return definedConfigs;
  },
  async init(config) {
    //may need to check config for validity
    //optinal values
    config.widgetAnimationIntervalTiming =
      config?.widgetAnimationIntervalTiming * 1000 || 6000;
    config.widgetCssAnimationTiming = config?.widgetCssAnimationTiming || 1.5;
    config.themeColor = config?.themeColor;


    //maps 
    const modalTemplateConfigMap = new Map();
    //set defaults
    modalTemplateConfigMap.set("modalImg", "https://djk97zng6lbya.cloudfront.net/2023/08/02/15/59/28/092cc561-68a7-4473-90b1-252c139fd559.png");
    modalTemplateConfigMap.set("heading", 'Liscensed Agents Standing By!');
    modalTemplateConfigMap.set("body", ['We found a licensed insurance agent to walk you through your options shortly.', 'Click "CALL" to be connected.']);
    modalTemplateConfigMap.set("buttonText", 'Call: !!parsedPhoneNumber!!');
    modalTemplateConfigMap.set("tty", 'Available Mon-Fri, 9am to 6pm EST (TTY:711)');


    const phoneWidgetTemplateConfigMap = new Map();

    phoneWidgetTemplateConfigMap.set("openIcon", "https://djk97zng6lbya.cloudfront.net/2023/08/02/14/14/50/19395e4c-0204-4613-bca7-3ddae8afa892.png");
    phoneWidgetTemplateConfigMap.set("closeIcon", "https://djk97zng6lbya.cloudfront.net/2023/08/02/14/14/42/58d25837-f7bb-474f-9f68-5cb2115f0f7d.png");
    phoneWidgetTemplateConfigMap.set("heading", "LICENSED AGENT STANDING BY");
    phoneWidgetTemplateConfigMap.set("body", "Get a free, no-obligation quote. Call Now!");
    phoneWidgetTemplateConfigMap.set("buttonText", "Call: !!parsedPhoneNumber!!");


    const templateConfigs = this.checkTemplateConfigs(config);

    //check for templating configs
    if (!templateConfigs.modal) {
      config.modal = {};
      modalTemplateConfigMap.forEach((value, key) => {
        config.modal[key] = value;
      })
    } else {
      //check if any keys in config are undefined
      modalTemplateConfigMap.forEach((value, key) => {
        if (!config.modal[key]) config.modal[key] = value;
      })
    }
    //check for templating configs
    if (!templateConfigs.phoneWidget) {
      config.phoneWidget = {};
      phoneWidgetTemplateConfigMap.forEach((value, key) => {
        config.phoneWidget[key] = value;
      })
    } else {
      //check if any keys in config are undefined
      phoneWidgetTemplateConfigMap.forEach((value, key) => {
        if (!config.phoneWidget[key]) config.phoneWidget[key] = value;
      })
    }

    //set anchor point to actual DOM element
    config.anchorPoint = document.querySelector(`${config.anchorPoint}`);


    //if we don't have a user provided phone number,we can assume we need to go get one 
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
    }
    //check if null , if yes reset to document body
    if (!config?.anchorPoint) {
      const regionMainExists = document.querySelector(".regionMain");
      if (regionMainExists) {
        config.anchorPoint = regionMainExists;
      }
      else {
        config.anchorPoint = document.body;
      }
    }
    //expose config
    this.config = config;

    //if we havent closed the modal yet, preload widget images
    if (!sessionStorage.getItem("modal-closed")) {
      clickToCall.preloadElement(config.phoneWidget.openIcon);
      clickToCall.preloadElement(config.phoneWidget.closeIcon);
    }

    //initialize
    this.modal.methods.initModal();
    console.log(`Click to Call JS initialized.`);
  },
  preloadElement(link) {
    const docLink = document.createElement("link");
    docLink.rel = "preload";
    docLink.href = link;
    docLink.as = "image"
    document.head.appendChild(docLink);
  }
};


window.clickToCall = clickToCall || {};
