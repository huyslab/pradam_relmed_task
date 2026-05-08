let preloadDotInterval = null;

const preload_video = {
  type: jsPsychPreload,
  video: ["RELMED_540p.mp4"],
  post_trial_gap: 400,
  show_progress_bar: false,
  message: `<p>Loading the video, this may take up to a minute</p><p>Thanks for your patience</p><p>.<span id='dots'></span></p>`,
  data: {
    trialphase: "preload_video"
  },
  continue_after_error: true,
  on_start: () => {
    // Report to tests
    console.log("load_successful")

    // Report to pradam.org
    postToParent({ message: "load_successful" })
  },
  on_load: function () {
    let dotCount = 0;
    const dotsElement = document.getElementById('dots');
    preloadDotInterval = setInterval(() => {
      dotCount = (dotCount + 1) % 5;
      dotsElement.textContent = '.'.repeat(dotCount);
    }, 500);
  },
  on_finish: function () {
    if (preloadDotInterval) {
      clearInterval(preloadDotInterval);
      preloadDotInterval = null;
    }
  }
};

const video_welcome_txt = {
  type: jsPsychInstructions,
  css_classes: ['instructions'],
  pages: [`
    <p>Before you dive in, please watch our introductory video.</p>
    <p>It explains how the games work and will help you feel prepared for what's ahead.</p>
    <p>Once you've watched it, you can move on to start the games!</p>
    `],
  show_clickable_nav: true,
  data: { trialphase: "instruction" }
};

const instruction_video = {
  type: jsPsychVideoButtonResponse,
  stimulus: ["RELMED_540p.mp4"],
  choices: ["Continue"],
  controls: true,
  height: 540,
  autoplay: false,
  trial_ends_after_video: false,
  response_allowed_while_playing: window.last_state === "video_start",
  on_start: function (trial) {
    updateState('video_start');

    // In simulation mode, allow immediate response and auto-end after video
    if (jsPsych.simulationMode !== undefined) {
      trial.response_allowed_while_playing = true;
      trial.trial_ends_after_video = true;
    }
  },
  data: { trialphase: "play_video" },
  on_finish: () => {
    updateState('video_end');
  }
};