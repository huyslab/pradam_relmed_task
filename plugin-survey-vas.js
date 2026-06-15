// Continuous visual-analogue-scale (VAS) survey plugin for the PRADAM task.
//
// Renders one or more items, each as a horizontal continuous line (0-100) with a
// left and right anchor label. Unlike a Likert grid (see plugin-survey-template.js),
// the response is continuous. To behave as a true clinical VAS the slider thumb is
// hidden until the participant actively places a mark, and (when require_response is
// true) every item must be answered before the trial can be submitted.

var jsPsychSurveyVAS = (function (jspsych) {
  'use strict';

  const info = {
    name: 'survey-vas',
    description: 'A questionnaire of continuous visual-analogue (slider) items.',
    version: "1.0",
    parameters: {
      items: {
        type: jspsych.ParameterType.COMPLEX,
        array: true,
        pretty_name: 'Items',
        description: 'Array of item objects: {prompt, description, left_anchor, right_anchor, name}',
        nested: {
          prompt: {
            type: jspsych.ParameterType.HTML_STRING,
            default: '',
            description: 'The (bold) heading for the item.'
          },
          description: {
            type: jspsych.ParameterType.HTML_STRING,
            default: '',
            description: 'Instruction text shown under the prompt.'
          },
          left_anchor: {
            type: jspsych.ParameterType.HTML_STRING,
            default: '',
            description: 'Label shown at the left (minimum) end of the line.'
          },
          right_anchor: {
            type: jspsych.ParameterType.HTML_STRING,
            default: '',
            description: 'Label shown at the right (maximum) end of the line.'
          },
          name: {
            type: jspsych.ParameterType.STRING,
            default: '',
            description: 'Optional key used for this item in the responses object.'
          }
        }
      },
      instructions: {
        type: jspsych.ParameterType.HTML_STRING,
        pretty_name: 'Instructions',
        default: '',
        description: 'The instructions shown above the items.'
      },
      min: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Min',
        default: 0,
        description: 'Minimum value of the continuous axis.'
      },
      max: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Max',
        default: 100,
        description: 'Maximum value of the continuous axis.'
      },
      step: {
        type: jspsych.ParameterType.FLOAT,
        pretty_name: 'Step',
        default: 1,
        description: 'Granularity of the slider.'
      },
      require_response: {
        type: jspsych.ParameterType.BOOL,
        pretty_name: 'Require response',
        default: true,
        description: 'If true, every item must be answered before continuing.'
      },
      survey_width: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Survey width',
        default: 700,
        description: 'The number of pixels occupied by the survey.'
      },
      button_label: {
        type: jspsych.ParameterType.STRING,
        pretty_name: 'Button label',
        default: 'Continue',
        description: 'The text that appears on the submit button.'
      },
      before_finish: {
        type: jspsych.ParameterType.FUNCTION,
        pretty_name: 'Run before trial finish',
        default: () => {},
        description: 'Runs just before the trial is terminated.'
      }
    },
    data: {
      responses: {
        type: jspsych.ParameterType.OBJECT,
        pretty_name: 'Participant responses (item key -> value)'
      },
      response_times: {
        type: jspsych.ParameterType.OBJECT,
        pretty_name: 'Time of first interaction with each item'
      },
      rt: {
        type: jspsych.ParameterType.FLOAT,
        pretty_name: 'Overall response time'
      }
    }
  };

  class SurveyVASPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    // Resolve the response key for an item (explicit name, else Q01, Q02, ...).
    itemKey(item, index) {
      return (item.name && item.name.length) ? item.name : "Q" + ("0" + (index + 1)).slice(-2);
    }

    trial(display_element, trial) {
      const self = this;

      // --- CSS ---
      let html = `<style>
      .vas-wrap { width: 100vw; }
      .vas-instructions {
        width: ${trial.survey_width}px;
        margin: 20px auto;
        font-size: 16px;
        line-height: 1.5em;
        text-align: left;
      }
      .vas-container {
        width: ${trial.survey_width}px;
        margin: auto;
      }
      .vas-item {
        background-color: #F8F8F8;
        border-radius: 8px;
        padding: 16px 24px 24px 24px;
        margin-bottom: 18px;
        text-align: left;
      }
      .vas-item.vas-missing { box-shadow: 0 0 0 2px #c0392b; }
      .vas-prompt { font-weight: bold; font-size: 16px; margin-bottom: 4px; }
      .vas-description { font-size: 14px; line-height: 1.4em; margin-bottom: 18px; }
      .vas-slider-row {
        display: grid;
        grid-template-columns: 1fr minmax(260px, 60%) 1fr;
        align-items: center;
        column-gap: 14px;
      }
      .vas-anchor { font-size: 13px; line-height: 1.2em; }
      .vas-anchor.left { text-align: right; }
      .vas-anchor.right { text-align: left; }
      /* Continuous line slider */
      .vas-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 2px;
        background: #333;
        outline: none;
        margin: 18px 0;
        cursor: pointer;
      }
      /* Vertical mark thumb (WebKit) */
      .vas-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 3px;
        height: 26px;
        background: #111;
        border: none;
        border-radius: 0;
        cursor: pointer;
      }
      /* Vertical mark thumb (Firefox) */
      .vas-slider::-moz-range-thumb {
        width: 3px;
        height: 26px;
        background: #111;
        border: none;
        border-radius: 0;
        cursor: pointer;
      }
      /* Hide the thumb until the participant places a mark */
      .vas-slider.vas-unset::-webkit-slider-thumb { opacity: 0; }
      .vas-slider.vas-unset::-moz-range-thumb { opacity: 0; }
      .vas-footer {
        width: ${trial.survey_width}px;
        margin: 0 auto 30px auto;
        text-align: right;
      }
      .vas-error {
        color: #c0392b;
        font-size: 14px;
        text-align: center;
        margin: 6px 0 12px 0;
        min-height: 18px;
      }
      .vas-footer input[type=submit] {
        background-color: #F0F0F0;
        padding: 8px 24px;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        color: black;
        cursor: pointer;
      }
      </style>`;

      // --- Markup ---
      html += '<div class="vas-wrap">';
      html += '<form id="vas-form">';

      if (trial.instructions) {
        html += `<div class="vas-instructions">${trial.instructions}</div>`;
      }

      html += '<div class="vas-container">';
      const mid = (trial.min + trial.max) / 2;
      for (let i = 0; i < trial.items.length; i++) {
        const item = trial.items[i];
        html += `<div class="vas-item" id="vas-item-${i}">`;
        if (item.prompt) html += `<div class="vas-prompt">${item.prompt}</div>`;
        if (item.description) html += `<div class="vas-description">${item.description}</div>`;
        html += '<div class="vas-slider-row">';
        html += `<div class="vas-anchor left">${item.left_anchor || ''}</div>`;
        html += `<input type="range" class="vas-slider vas-unset" id="vas-slider-${i}" ` +
                `min="${trial.min}" max="${trial.max}" step="${trial.step}" value="${mid}">`;
        html += `<div class="vas-anchor right">${item.right_anchor || ''}</div>`;
        html += '</div>';
        html += '</div>';
      }
      html += '</div>'; // container

      html += '<div class="vas-error" id="vas-error"></div>';
      html += '<div class="vas-footer">';
      html += `<input type="submit" value="${trial.button_label}"></input>`;
      html += '</div>';

      html += '</form>';
      html += '</div>';

      display_element.innerHTML = html;

      // --- Response handling ---
      const startTime = performance.now();
      const answered = new Array(trial.items.length).fill(false);
      const response_times = {};

      const markAnswered = (i) => {
        if (!answered[i]) {
          answered[i] = true;
          response_times[self.itemKey(trial.items[i], i)] = performance.now() - startTime;
          const slider = display_element.querySelector(`#vas-slider-${i}`);
          slider.classList.remove('vas-unset');
          display_element.querySelector(`#vas-item-${i}`).classList.remove('vas-missing');
        }
      };

      for (let i = 0; i < trial.items.length; i++) {
        const slider = display_element.querySelector(`#vas-slider-${i}`);
        // 'input' fires on drag / keyboard; 'pointerdown' catches a click that lands
        // exactly on the current value (which would not change it).
        slider.addEventListener('input', () => markAnswered(i));
        slider.addEventListener('pointerdown', () => markAnswered(i));
        slider.addEventListener('keydown', () => markAnswered(i));
      }

      display_element.querySelector('#vas-form').addEventListener('submit', (event) => {
        event.preventDefault();

        // Validate: all items answered when required.
        if (trial.require_response) {
          const missing = [];
          for (let i = 0; i < trial.items.length; i++) {
            const itemEl = display_element.querySelector(`#vas-item-${i}`);
            if (!answered[i]) {
              missing.push(i);
              itemEl.classList.add('vas-missing');
            } else {
              itemEl.classList.remove('vas-missing');
            }
          }
          if (missing.length > 0) {
            display_element.querySelector('#vas-error').textContent =
              'Please place a mark on every line before continuing.';
            display_element.querySelector(`#vas-item-${missing[0]}`)
              .scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
          }
        }

        const rt = performance.now() - startTime;
        const responses = {};
        for (let i = 0; i < trial.items.length; i++) {
          const key = self.itemKey(trial.items[i], i);
          const slider = display_element.querySelector(`#vas-slider-${i}`);
          responses[key] = answered[i] ? Number(slider.value) : null;
        }

        const trialdata = {
          responses: responses,
          response_times: response_times,
          rt: rt
        };

        trial.before_finish(trialdata);
        display_element.innerHTML = '';
        self.jsPsych.finishTrial(trialdata);
      });
    }

    // --- Simulation ---
    simulate(trial, simulation_mode, simulation_options, load_callback) {
      if (simulation_mode == "data-only") {
        load_callback();
        this.simulate_data_only(trial, simulation_options);
      }
      if (simulation_mode == "visual") {
        this.simulate_visual(trial, simulation_options, load_callback);
      }
    }

    create_simulation_data(trial, simulation_options) {
      const responses = {};
      const response_times = {};
      let last_t = 0;
      for (let i = 0; i < trial.items.length; i++) {
        const key = this.itemKey(trial.items[i], i);
        responses[key] = Math.round(
          this.jsPsych.randomization.randomInt(trial.min, trial.max)
        );
        last_t += this.jsPsych.randomization.sampleExGaussian(1200, 300, 1 / 200, true);
        response_times[key] = last_t;
      }
      const default_data = {
        responses: responses,
        response_times: response_times,
        rt: last_t + 200
      };
      const data = this.jsPsych.pluginAPI.mergeSimulationData(default_data, simulation_options);
      this.jsPsych.pluginAPI.ensureSimulationDataConsistency(trial, data);
      return data;
    }

    simulate_data_only(trial, simulation_options) {
      const data = this.create_simulation_data(trial, simulation_options);
      this.jsPsych.finishTrial(data);
    }

    simulate_visual(trial, simulation_options, load_callback) {
      const data = this.create_simulation_data(trial, simulation_options);
      const display_element = this.jsPsych.getDisplayElement();
      this.trial(display_element, trial);
      load_callback();
      const entries = Object.entries(data.responses);
      for (let i = 0; i < entries.length; i++) {
        const slider = display_element.querySelector(`#vas-slider-${i}`);
        if (slider) {
          slider.value = entries[i][1];
          slider.classList.remove('vas-unset');
          slider.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
      this.jsPsych.pluginAPI.clickTarget(
        display_element.querySelector('input[type="submit"]'),
        data.rt
      );
    }
  }

  SurveyVASPlugin.info = info;
  return SurveyVASPlugin;

})(jsPsychModule);
