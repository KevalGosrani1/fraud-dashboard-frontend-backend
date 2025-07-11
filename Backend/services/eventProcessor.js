const { getQueue } = require("./eventQueue");
const { sendAlert } = require("./alertService");

function startProcessor() {
  setInterval(async () => {
    const queue = getQueue();
    if (queue.length === 0) return;

    const event = queue.shift();

    // Only trigger alert if riskLevel is high
    if (parseInt(event.riskLevel) >= 3) {
      await sendAlert(event);
    }
  }, 2000);
}

module.exports = { startProcessor };
