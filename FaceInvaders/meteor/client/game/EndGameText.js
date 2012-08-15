var endGameTextAnimationDurations = {
  "Lose": {
    EndText: 0.5,
    Left: 0.5,
    Right: 0.5,
    Restart: 0.5,
  },
  "Win": {
    EndText: 0,
    Left: 0.5,
    Right: 0.5,
    Restart: 0.5,
  }
}

function createEndGameText (game, leftText, rightText, animationCallback) {
  var container = $("<div class='Container'>");
  var state = game.winOrLose;

  var left = $("<div class='Left'>");
  left.append(leftText);
  var right = $("<div class='Right'>");
  right.append(rightText);
  container.append(left, right);

  var endText = $("<div class='EndText'>");
  endText.addClass(state);
  endText.append(container);

  function queueAnimation(el, duration, delay) {
    el.css({
      "-webkit-animation-duration": duration + "s",
      "-webkit-animation-delay": delay + "s",
    });
    return duration + delay;
  }
  function dequeueAnimation(el) {
    el.css({
      "-webkit-animation-duration": "",
      "-webkit-animation-delay": "",
    });
  };

  var delay = queueAnimation(endText, endGameTextAnimationDurations[state].EndText, 0);
  delay = queueAnimation(left, endGameTextAnimationDurations[state].Left, delay);
  delay = queueAnimation(right, endGameTextAnimationDurations[state].Right, delay);

  var restart = $("<div class='Restart'>");
  var thatGame = game;
  restart.on("click", function () {thatGame.reset(); });
  container.append(restart);
  delay = queueAnimation(restart, endGameTextAnimationDurations[state].Restart, delay);

  if (state === "Lose")
    restart.append("Retry?");
  else if (state === "Win")
    restart.append("But...the princess is in another castle!");
  else {
    restart.append("Error! Does not compute. Self-destruct in 3... 2... 1...");
    console.error("The game isn't over yet! Are you trying to trick me?");
  }
  
  game.world.el.append(endText);
  var callbackFunction = animationCallback;
  setTimeout(function () {
    if (state === "Win") {
      dequeueAnimation(left);
      dequeueAnimation(right);
    }
    callbackFunction();
  }, delay * 1000);

  return endText;
}